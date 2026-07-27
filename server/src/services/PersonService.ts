import { prisma } from '../prisma';
import type { Person } from '@prisma/client';

interface UpsertArgs {
  email: string;
  name: string;
  phone?: string | null;
  passwordHash?: string;
  updateNameIfExists?: boolean;
}

export async function upsertPersonByEmail({
  email,
  name,
  phone,
  passwordHash,
  updateNameIfExists = false,
}: UpsertArgs): Promise<Person> {
  return prisma.person.upsert({
    where: { email },
    update: updateNameIfExists && name ? { name } : {},
    create: { name: name || email, email, phone: phone ?? null, passwordHash: passwordHash ?? null },
  });
}
