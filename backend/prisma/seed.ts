// Cria o primeiro usuário admin.
// Rode UMA vez após a migration, com as variáveis SEED_ADMIN_USER e SEED_ADMIN_PASS definidas.
// No Railway: defina as variáveis e rode `npm run seed` via shell do serviço, ou localmente apontando pra DATABASE_URL.

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USER;
  const password = process.env.SEED_ADMIN_PASS;

  if (!username || !password) {
    throw new Error('Defina SEED_ADMIN_USER e SEED_ADMIN_PASS antes de rodar o seed.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash },
  });

  console.log(`Admin criado/garantido: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
