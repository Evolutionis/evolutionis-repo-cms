import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GithubService } from '../github/github.service';

@Controller('images')
@UseGuards(AuthGuard('jwt'))
export class ImagesController {
  constructor(private github: GithubService) {}

  // Lista as imagens já enviadas (para a biblioteca no admin).
  @Get()
  list() {
    return this.github.listImages();
  }

  /**
   * Upload de imagem. O front envia o arquivo em base64 (sem o prefixo "data:...").
   * body = { fileName: "banner.jpg", base64: "....", comment?: "..." }
   * Retorna { path, publicUrl } — guarde publicUrl no content.json.
   */
  @Post('upload')
  upload(
    @Body() body: { fileName: string; base64: string; comment?: string },
  ) {
    return this.github.commitImage(
      body.fileName,
      body.base64,
      body.comment || `Upload de imagem: ${body.fileName}`,
    );
  }
}
