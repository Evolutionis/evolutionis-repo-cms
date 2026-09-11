import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { THROTTLE_LOGIN } from '../throttler.config';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // Achado A3: sem limite, login aceitava tentativas ilimitadas. O limite
  // por IP abaixo (5/min) é a primeira barreira; o AuthService acrescenta um
  // bloqueio progressivo por username, que não depende do IP de origem.
  // O mesmo limite cobre as duas idas (senha, depois código do 2FA) — 5/min
  // é suficiente para alguém digitando os dois, apertado demais para quem
  // está tentando adivinhar.
  @Throttle({ default: THROTTLE_LOGIN })
  @Post('login')
  login(@Body() body: { username: string; password: string; totpCode?: string }) {
    return this.auth.login(body.username, body.password, body.totpCode);
  }

  // Quem está logado, com que papel e se tem 2FA — sempre lido do banco no
  // momento da chamada (ver AuthService.me), nunca do que o JWT diz.
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.userId);
  }

  // Autoatendimento: qualquer conta troca a própria senha, exigindo a atual.
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(@Body() body: { senhaAtual: string; novaSenha: string }, @Req() req: any) {
    return this.auth.changePassword(req.user.userId, body.senhaAtual, body.novaSenha);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/setup')
  setup2fa(@Req() req: any) {
    return this.auth.setup2fa(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/enable')
  enable2fa(@Body() body: { code: string }, @Req() req: any) {
    return this.auth.enable2fa(req.user.userId, body.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/disable')
  disable2fa(@Body() body: { password: string }, @Req() req: any) {
    return this.auth.disable2fa(req.user.userId, body.password);
  }
}
