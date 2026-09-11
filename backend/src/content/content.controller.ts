import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';
import { PermissionsService } from '../auth/permissions.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('content')
export class ContentController {
  constructor(
    private content: ContentService,
    private permissions: PermissionsService,
  ) {}

  // Público: o site ou o admin pode ler o conteúdo de um ambiente.
  // Sem `?ambiente=` vem homologação, que é o que o painel edita.
  @Get('current')
  getCurrent(@Query('ambiente') ambiente?: string) {
    return this.content.getCurrent(ambiente);
  }

  // --- A partir daqui, tudo exige JWT válido ---

  // Situação dos dois ambientes de uma vez: o que está no preview, o que está
  // no ar para o cliente, e se são a mesma versão.
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  status() {
    return this.content.status();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('versions')
  listVersions() {
    return this.content.listVersions();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('versions/:id')
  getVersion(@Param('id') id: string) {
    return this.content.getVersion(id);
  }

  // Publica em HOMOLOGAÇÃO. Produção não é tocada aqui — por isso qualquer
  // conta autenticada pode, EDITOR incluso: é o uso do dia a dia.
  @UseGuards(AuthGuard('jwt'))
  @Post('publish')
  publish(
    @Body() body: { sections: Record<string, unknown>; comment?: string },
    @Req() req: any,
  ) {
    return this.content.publish(body.sections, body.comment, req.user.userId);
  }

  // Leva para PRODUÇÃO o que está em homologação. Com `versionId` no corpo,
  // promove aquela versão específica — é como se volta produção para algo
  // antigo sem passar de novo pelo preview. Só ADMIN: é o que o cliente vê.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('promote')
  promote(@Body() body?: { versionId?: string }) {
    return this.content.promote(body?.versionId);
  }

  // Rollback serve os dois ambientes por um `?ambiente=` só — em homologação é
  // uso normal (mesmo nível de publish), mas em produção é literalmente uma
  // promoção (ContentService delega para promote()) e por isso pede ADMIN aqui
  // também. Não dá para expressar essa condição com @Roles(), que olha só o
  // handler e não o corpo da requisição — daí a checagem manual abaixo.
  @UseGuards(AuthGuard('jwt'))
  @Post('rollback/:versionId')
  async rollback(
    @Param('versionId') versionId: string,
    @Req() req: any,
    @Query('ambiente') ambiente?: string,
  ) {
    if (ambiente === 'prod') {
      const papel = await this.permissions.papelAtual(req.user.userId);
      if (papel !== 'ADMIN') {
        throw new ForbiddenException('Apenas administradores podem reverter produção.');
      }
    }
    return this.content.rollback(versionId, req.user.userId, ambiente);
  }
}
