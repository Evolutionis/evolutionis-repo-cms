import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Dureza defensiva, não fechamento de vulnerabilidade: sem estas variáveis
// o comportamento do processo seria indefinido em vários pontos (JWT
// assinado com segredo ausente, GitHubService sem token, Prisma sem string
// de conexão). Falha cedo e com mensagem clara em vez de subir quebrado.
// Nota: testado durante a auditoria de segurança que o jsonwebtoken já
// recusa segredo vazio/indefinido e lança exceção (não gera token
// forjável) — isto aqui é só para não deixar o processo tentar subir sem
// sentido.
function validarVariaveisObrigatorias() {
  const faltando: string[] = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    faltando.push('JWT_SECRET (ausente ou com menos de 32 caracteres)');
  }
  if (!process.env.GITHUB_TOKEN) {
    faltando.push('GITHUB_TOKEN');
  }
  if (!process.env.DATABASE_URL) {
    faltando.push('DATABASE_URL');
  }

  if (faltando.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes ou inválidas: ${faltando.join(', ')}. ` +
      'Configure-as antes de iniciar o backend.',
    );
  }
}

async function bootstrap() {
  validarVariaveisObrigatorias();

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
