import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ImagesController } from './images.controller';
import { ContentService } from './content.service';
import { GithubService } from '../github/github.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  // Traz PermissionsService e RolesGuard: promover para produção (e reverter
  // produção) exige ADMIN, checado no banco a cada chamada — ver roles.guard.ts.
  imports: [AuthModule],
  controllers: [ContentController, ImagesController],
  providers: [ContentService, GithubService, PrismaService],
})
export class ContentModule {}
