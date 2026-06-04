import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private content: ContentService) {}

  // Público: o site ou o admin pode ler o conteúdo atual.
  @Get('current')
  getCurrent() {
    return this.content.getCurrent();
  }

  // --- A partir daqui, tudo exige JWT válido ---

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

  @UseGuards(AuthGuard('jwt'))
  @Post('publish')
  publish(
    @Body() body: { sections: Record<string, unknown>; comment?: string },
    @Req() req: any,
  ) {
    return this.content.publish(body.sections, body.comment, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('rollback/:versionId')
  rollback(@Param('versionId') versionId: string, @Req() req: any) {
    return this.content.rollback(versionId, req.user.userId);
  }
}
