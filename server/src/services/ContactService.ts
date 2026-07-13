import { prisma } from '../prisma';
import { upsertPersonByEmail } from './PersonService';

function notifyFormspree(label: string, payload: Record<string, unknown>) {
  const endpoint = process.env.FORMSPREE_CONTACT_ENDPOINT;
  if (!endpoint) {
    console.warn(`[formspree ${label}] FORMSPREE_CONTACT_ENDPOINT not set — email skipped`);
    return;
  }
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (r) => {
      if (!r.ok) console.error(`[formspree ${label}] HTTP`, r.status, await r.text());
      else console.log(`[formspree ${label}] sent OK`);
    })
    .catch((err) => console.error(`[formspree ${label}] fetch error:`, err));
}

interface ContactArgs {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function submitContact(args: ContactArgs) {
  const { name, email, phone, subject, message } = args;
  const person = await upsertPersonByEmail({ email, name, phone });
  const record = await prisma.contactMessage.create({
    data: { personId: person.id, name, email, phone: phone || null, subject, message },
  });
  notifyFormspree('contact', {
    name, email, phone, subject, message,
    _subject: `[MD Fine Art] ${subject} — ${name}`,
    _replyto: email,
  });
  return record;
}

interface CommissionArgs {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
}

export async function submitCommission(args: CommissionArgs) {
  const { name, email, phone, subject, description } = args;
  const person = await upsertPersonByEmail({ email, name, phone });
  const record = await prisma.commissionRequest.create({
    data: { personId: person.id, name, email, phone: phone || null, subject, description },
  });
  notifyFormspree('commission', {
    name, email, phone, subject, description,
    _subject: `[MD Fine Art] Commission Request — ${name}`,
    _replyto: email,
  });
  return record;
}
