import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private content: ContentService) {}

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

  // Publica em HOMOLOGAÇÃO. Produção não é tocada aqui.
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
  // antigo sem passar de novo pelo preview.
  @UseGuards(AuthGuard('jwt'))
  @Post('promote')
  promote(@Body() body?: { versionId?: string }) {
    return this.content.promote(body?.versionId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('rollback/:versionId')
  rollback(
    @Param('versionId') versionId: string,
    @Req() req: any,
    @Query('ambiente') ambiente?: string,
  ) {
    return this.content.rollback(versionId, req.user.userId, ambiente);
  }
}
