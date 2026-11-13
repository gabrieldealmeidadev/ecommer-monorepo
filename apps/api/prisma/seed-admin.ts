import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_ADMIN_NAME || 'Administrador';
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    console.error('Configure SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (mínimo 12 caracteres) no .env.');
    process.exitCode = 1;
    return;
  }
  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, role: Role.ADMIN },
    create: { name, email: email.toLowerCase(), passwordHash, role: Role.ADMIN }
  });
  console.log(`Administrador configurado: ${email}`);
}

main()
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
