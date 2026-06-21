import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: libera o front do admin. Em produção, troque '*' pela URL do admin.
  app.enableCors({
    origin: process.env.ADMIN_ORIGIN || true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Railway injeta a porta via process.env.PORT
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend rodando na porta ${port}`);
}
bootstrap();
