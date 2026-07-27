import { prisma } from '../prisma';
import { upsertPersonByEmail } from './PersonService';
import { sendContactNotification, sendCommissionNotification } from './EmailService';

async function getContactEmail(galleryId: string): Promise<string | null> {
  const config = await prisma.siteConfig.findUnique({ where: { galleryId }, select: { contactEmail: true } });
  return config?.contactEmail ?? null;
}

interface ContactArgs {
  galleryId: string;
  galleryName: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function submitContact(args: ContactArgs) {
  const { galleryId, galleryName, name, email, phone, subject, message } = args;
  const person = await upsertPersonByEmail({ email, name, phone });
  const record = await prisma.contactMessage.create({
    data: { galleryId, personId: person.id, name, email, phone: phone || null, subject, message },
  });

  const to = await getContactEmail(galleryId);
  if (to) {
    sendContactNotification({ to, galleryName, name, email, phone, subject, message })
      .catch((err) => console.error('[contact-notification] failed for gallery', galleryId, err));
  } else {
    console.warn('[contact-notification] no contactEmail set for gallery', galleryId);
  }

  return record;
}

interface CommissionArgs {
  galleryId: string;
  galleryName: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
}

export async function submitCommission(args: CommissionArgs) {
  const { galleryId, galleryName, name, email, phone, subject, description } = args;
  const person = await upsertPersonByEmail({ email, name, phone });
  const record = await prisma.commissionRequest.create({
    data: { galleryId, personId: person.id, name, email, phone: phone || null, subject, description },
  });

  const to = await getContactEmail(galleryId);
  if (to) {
    sendCommissionNotification({ to, galleryName, name, email, phone, subject, description })
      .catch((err) => console.error('[commission-notification] failed for gallery', galleryId, err));
  } else {
    console.warn('[commission-notification] no contactEmail set for gallery', galleryId);
  }

  return record;
}
