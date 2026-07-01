import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/seed-admin.ts <email> <password>');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const person = await prisma.person.upsert({
    where: { email: email.toLowerCase() },
    update: { isAdmin: true, passwordHash },
    create: {
      email: email.toLowerCase(),
      name: 'Admin',
      isAdmin: true,
      passwordHash,
    },
  });

  console.log(`Admin seeded: ${person.email} (id: ${person.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
