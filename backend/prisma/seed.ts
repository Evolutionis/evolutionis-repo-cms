// Cria o primeiro usuário admin.
// Rode UMA vez após a migration, com as variáveis SEED_ADMIN_USER e SEED_ADMIN_PASS definidas.
// No Railway: defina as variáveis e rode `npm run seed` via shell do serviço, ou localmente apontando pra DATABASE_URL.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { validarSenhaForte } from '../src/auth/senha.util';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USER;
  const password = process.env.SEED_ADMIN_PASS;

  if (!username || !password) {
    throw new Error('Defina SEED_ADMIN_USER e SEED_ADMIN_PASS antes de rodar o seed.');
  }
  // Mesma política do resto do painel (backend/src/auth/senha.util.ts): é a
  // primeira conta do sistema, a que cria todas as outras — não faz sentido
  // ela nascer com a senha fraca que este seed existe para consertar.
  validarSenhaForte(password);

  const passwordHash = await bcrypt.hash(password, 10);

  // update: {} de propósito — se a conta já existe, o seed não mexe no papel
  // dela. Um ADMIN pode ter rebaixado essa conta deliberadamente depois do
  // primeiro boot, e rodar o seed de novo (idempotência é o ponto) não deve
  // desfazer isso. O papel ADMIN só é forçado na criação, quando é
  // literalmente a primeira conta do ambiente.
  const user = await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash, role: 'ADMIN' },
  });

  console.log(`Admin criado/garantido: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
