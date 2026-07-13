import { prisma } from '../prisma';
import type { Person } from '@prisma/client';

interface UpsertArgs {
  email: string;
  name: string;
  phone?: string | null;
  updateNameIfExists?: boolean;
}

export async function upsertPersonByEmail({
  email,
  name,
  phone,
  updateNameIfExists = false,
}: UpsertArgs): Promise<Person> {
  return prisma.person.upsert({
    where: { email },
    update: updateNameIfExists && name ? { name } : {},
    create: { name: name || email, email, phone: phone ?? null },
  });
}
