import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsService } from './permissions.service';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsService, RolesGuard, PrismaService],
  // ContentModule (rota de promoção) e UsersModule (gerenciar contas) importam
  // este módulo só para ganhar acesso a PermissionsService e RolesGuard —
  // são os dois pontos do sistema que checam papel de usuário.
  exports: [PermissionsService, RolesGuard],
})
export class AuthModule {}
