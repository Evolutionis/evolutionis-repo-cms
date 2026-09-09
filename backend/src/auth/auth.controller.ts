import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { THROTTLE_LOGIN } from '../throttler.config';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // Achado A3: sem limite, login aceitava tentativas ilimitadas. O limite
  // por IP abaixo (5/min) é a primeira barreira; o AuthService acrescenta um
  // bloqueio progressivo por username, que não depende do IP de origem.
  @Throttle({ default: THROTTLE_LOGIN })
  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.auth.login(body.username, body.password);
  }
}
