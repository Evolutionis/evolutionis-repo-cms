import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { THROTTLE_PADRAO } from './throttler.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Limite padrão para toda a API (achado A3): 60 requisições por minuto
    // por IP. Rotas específicas (como /auth/login) sobrescrevem isto com
    // @Throttle para um limite mais restritivo.
    ThrottlerModule.forRoot([THROTTLE_PADRAO]),
    AuthModule,
    ContentModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplica o rate limit globalmente — sem isto, o ThrottlerModule só
    // registra os limites, mas nenhuma rota é protegida de fato.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
