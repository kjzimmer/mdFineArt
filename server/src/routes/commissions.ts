import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, phone, subject, description } = req.body;
  if (!name || !email || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const person = await prisma.person.upsert({
      where: { email },
      update: {},
      create: { name, email, phone: phone || null },
    });

    const record = await prisma.commissionRequest.create({
      data: { personId: person.id, name, email, phone: phone || null, subject, description },
    });

    const endpoint = process.env.FORMSPREE_CONTACT_ENDPOINT;
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, description, _subject: `[MD Fine Art] Commission Request — ${name}`, _replyto: email }),
      })
        .then(async (r) => {
          if (!r.ok) console.error('[formspree commission] HTTP', r.status, await r.text());
          else console.log('[formspree commission] sent OK');
        })
        .catch((err) => console.error('[formspree commission] fetch error:', err));
    } else {
      console.warn('[formspree commission] FORMSPREE_CONTACT_ENDPOINT not set — email skipped');
    }

    res.status(201).json({ success: true, id: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save commission request' });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  const commissions = await prisma.commissionRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(commissions);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updated = await prisma.commissionRequest.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
