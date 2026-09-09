/**
 * Teste do limite de tentativas no login (achado A3).
 *
 * Roda com `npm test`, sem framework e sem banco: sobe uma aplicação Nest de
 * verdade — com o AuthController real, o decorator @Throttle real e o
 * ThrottlerGuard real — e troca só o AuthService por um dublê, que é a única
 * peça que precisaria do Postgres.
 *
 * O que se verifica aqui é o comportamento observável de fora: a partir de
 * qual tentativa a resposta muda, e se dois clientes diferentes têm baldes
 * separados.
 */
import { Controller, Module, Post, Body, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import {
  THROTTLE_PADRAO,
  THROTTLE_LOGIN,
  PROXIES_CONFIAVEIS,
} from '../src/throttler.config';

// ---------------------------------------------------------------- utilidades

let falhas = 0;
let total = 0;

function ok(condicao: boolean, descricao: string, detalhe = '') {
  total++;
  if (condicao) {
    console.log(`  \x1b[32m✓\x1b[0m ${descricao}`);
  } else {
    falhas++;
    console.log(`  \x1b[31m✗\x1b[0m ${descricao}${detalhe ? `\n      ${detalhe}` : ''}`);
  }
}

function igual(recebido: unknown, esperado: unknown, descricao: string) {
  ok(
    JSON.stringify(recebido) === JSON.stringify(esperado),
    descricao,
    `esperado ${JSON.stringify(esperado)}, recebido ${JSON.stringify(recebido)}`,
  );
}

// ------------------------------------------------------- aplicação de teste

/** AuthService que nunca aceita a senha — o que importa aqui é o limite. */
class AuthServiceFalso {
  chamadas = 0;
  async login() {
    this.chamadas++;
    const { UnauthorizedException } = await import('@nestjs/common');
    throw new UnauthorizedException('Credenciais inválidas');
  }
}

@Module({
  imports: [ThrottlerModule.forRoot([THROTTLE_PADRAO])],
  controllers: [AuthController],
  providers: [
    { provide: AuthService, useClass: AuthServiceFalso },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
class ModuloDeTeste {}

async function subir(confiarNoProxy: boolean): Promise<{ app: INestApplication; url: string }> {
  const app = await NestFactory.create<NestExpressApplication>(ModuloDeTeste, {
    logger: false,
  });
  if (confiarNoProxy) app.set('trust proxy', PROXIES_CONFIAVEIS);
  await app.listen(0, '127.0.0.1');
  return { app, url: await app.getUrl() };
}

async function tentarLogin(url: string, ipDoCliente?: string): Promise<number> {
  const res = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ipDoCliente ? { 'X-Forwarded-For': ipDoCliente } : {}),
    },
    body: JSON.stringify({ username: 'admin', password: 'errada' }),
  });
  return res.status;
}

// ------------------------------------------------------------------- testes

async function testeLimitePorIp() {
  console.log('\nLimite por IP na rota de login');
  const { app, url } = await subir(true);
  try {
    const limite = THROTTLE_LOGIN.limit;
    const status: number[] = [];
    // Dispara N+1: as N primeiras passam pelo guard (e levam 401 do dublê),
    // a N+1 é barrada antes de chegar ao controller.
    for (let i = 0; i < limite + 1; i++) {
      status.push(await tentarLogin(url, '203.0.113.10'));
    }

    igual(
      status.slice(0, limite),
      Array(limite).fill(401),
      `as ${limite} primeiras tentativas chegam ao login (401)`,
    );
    igual(status[limite], 429, `a tentativa ${limite + 1} é barrada com 429`);
  } finally {
    await app.close();
  }
}

async function testeBaldesSeparadosPorCliente() {
  console.log('\nClientes diferentes não compartilham o mesmo balde');
  const { app, url } = await subir(true);
  try {
    const limite = THROTTLE_LOGIN.limit;
    // Um cliente queima a cota inteira...
    for (let i = 0; i < limite + 1; i++) await tentarLogin(url, '203.0.113.10');
    const atacante = await tentarLogin(url, '203.0.113.10');
    // ...e outro, vindo de outro IP, tem que continuar conseguindo tentar.
    const legitimo = await tentarLogin(url, '198.51.100.20');

    igual(atacante, 429, 'quem estourou o limite continua barrado');
    igual(
      legitimo,
      401,
      'outro IP ainda consegue tentar (não foi barrado pelo vizinho)',
    );
  } finally {
    await app.close();
  }
}

async function testeSemTrustProxyOsBaldesSeMisturam() {
  console.log('\nSem trust proxy, o limite por IP vira um balde único');
  const { app, url } = await subir(false);
  try {
    const limite = THROTTLE_LOGIN.limit;
    for (let i = 0; i < limite + 1; i++) await tentarLogin(url, '203.0.113.10');
    const outroIp = await tentarLogin(url, '198.51.100.20');

    // Isto documenta POR QUE o trust proxy é necessário: sem ele, req.ip é o
    // peer TCP (igual para todos atrás do proxy) e um cliente derruba o outro.
    igual(
      outroIp,
      429,
      'sem trust proxy, um IP diferente herda o bloqueio do vizinho (por isso a configuração existe)',
    );
  } finally {
    await app.close();
  }
}

async function testeBloqueioProgressivoPorUsername() {
  console.log('\nBloqueio progressivo por username');

  // AuthService real, com Prisma e JWT dublados: o alvo aqui é a contagem de
  // falhas, que é lógica pura e não precisa de banco.
  const prismaFalso = { adminUser: { findUnique: async () => null } } as any;
  const jwtFalso = { signAsync: async () => 'token' } as any;
  const service = new AuthService(prismaFalso, jwtFalso);

  const erros: string[] = [];
  for (let i = 0; i < 6; i++) {
    try {
      await service.login('admin', 'errada');
      erros.push('(sem erro)');
    } catch (e: any) {
      erros.push(e.message);
    }
  }

  igual(
    erros.slice(0, 5),
    Array(5).fill('Credenciais inválidas'),
    'as 5 primeiras falhas respondem credenciais inválidas',
  );
  ok(
    erros[5].includes('Muitas tentativas'),
    'a 6ª tentativa é bloqueada pelo contador por username',
    `recebido: ${erros[5]}`,
  );

  // O bloqueio vale mesmo para um username que não existe no banco — se só
  // valesse para os existentes, a diferença de resposta revelaria quais são.
  const outro = new AuthService(prismaFalso, jwtFalso);
  const respostas: string[] = [];
  for (let i = 0; i < 6; i++) {
    try {
      await outro.login('nao-existe', 'x');
    } catch (e: any) {
      respostas.push(e.message);
    }
  }
  ok(
    respostas[5].includes('Muitas tentativas'),
    'username inexistente é bloqueado igual (não vaza quem existe)',
    `recebido: ${respostas[5]}`,
  );
}

async function testeMemoriaNaoCresceSemLimite() {
  console.log('\nA contagem por username não cresce sem limite');

  const prismaFalso = { adminUser: { findUnique: async () => null } } as any;
  const jwtFalso = { signAsync: async () => 'token' } as any;
  const service = new AuthService(prismaFalso, jwtFalso);

  // Um atacante variando o username a cada tentativa cria uma entrada nova
  // por requisição. Sem teto nem limpeza, isso é um vazamento de memória
  // alcançável por qualquer um, sem autenticação.
  for (let i = 0; i < 12_000; i++) {
    try {
      await service.login(`usuario-${i}`, 'x');
    } catch {
      /* esperado */
    }
  }

  const tamanho = (service as any).tentativas.size as number;
  ok(
    tamanho <= 10_000,
    `o mapa de tentativas fica limitado (${tamanho} entradas após 12.000 usernames distintos)`,
    `cresceu para ${tamanho} — sem teto`,
  );
}

// -------------------------------------------------------------------- main

(async () => {
  console.log('Limite de tentativas no login (achado A3)');
  await testeLimitePorIp();
  await testeBaldesSeparadosPorCliente();
  await testeSemTrustProxyOsBaldesSeMisturam();
  await testeBloqueioProgressivoPorUsername();
  await testeMemoriaNaoCresceSemLimite();

  console.log(`\n${total - falhas}/${total} verificações passaram.`);
  process.exit(falhas > 0 ? 1 : 0);
})();
