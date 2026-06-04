import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ImagesController } from './images.controller';
import { ContentService } from './content.service';
import { GithubService } from '../github/github.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ContentController, ImagesController],
  providers: [ContentService, GithubService, PrismaService],
})
export class ContentModule {}
