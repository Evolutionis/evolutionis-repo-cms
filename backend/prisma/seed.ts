// Garante que existe um primeiro usuário admin.
//
// Roda a cada boot (o script `start` chama antes de subir a aplicação), então
// a regra número um aqui é: não derrubar um ambiente que já está de pé. Só
// cria conta quando não há nenhuma; nunca mexe em conta existente.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { validarSenhaForte } from '../src/auth/senha.util';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USER;
  const password = process.env.SEED_ADMIN_PASS;

  // Conta já criada num boot anterior: nada a fazer. Sai ANTES de validar a
  // senha do ambiente de propósito — a senha que vale é a que está no banco
  // (trocável em "Minha conta"), não a da variável, que pode ter ficado para
  // trás com o valor fraco do primeiro dia. Validar aqui faria o seed falhar
  // e, como `start` é `seed && node dist/main`, o backend deixaria de subir
  // por causa de uma variável que não é mais usada para nada.
  if (username) {
    const existente = await prisma.adminUser.findUnique({ where: { username } });
    if (existente) {
      console.log(`Admin já existe: ${existente.username} — seed não faz nada.`);
      return;
    }
  }

  // Nenhuma conta com esse nome. Se já há OUTRAS contas no painel, o ambiente
  // está bootstrapado e as variáveis do seed viraram sobra: sair quieto é
  // melhor do que criar um admin surpresa (ou explodir por falta de variável).
  const total = await prisma.adminUser.count();
  if (total > 0) {
    console.log(`Painel já tem ${total} usuário(s) — seed não faz nada.`);
    return;
  }

  // Daqui para baixo é primeiro boot de verdade: sem as variáveis ninguém
  // conseguiria entrar, então aqui falhar alto é o certo.
  if (!username || !password) {
    throw new Error(
      'Banco sem nenhum usuário e SEED_ADMIN_USER/SEED_ADMIN_PASS não definidas — ' +
        'defina as duas para criar a primeira conta do painel.',
    );
  }
  // Mesma política do resto do painel (backend/src/auth/senha.util.ts). É a
  // conta que cria todas as outras e promove para produção: não faz sentido
  // nascer com a senha fraca que esta política existe para impedir.
  validarSenhaForte(password);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { username, passwordHash, role: 'ADMIN' },
  });

  console.log(`Admin criado: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
