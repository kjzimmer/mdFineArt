import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const record = await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject, message },
    });
    const formspreeId = process.env.FORMSPREE_CONTACT_ID;
    if (formspreeId) {
      fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      })
        .then(async (r) => {
          if (!r.ok) console.error('[formspree contact] HTTP', r.status, await r.text());
          else console.log('[formspree contact] sent OK');
        })
        .catch((err) => console.error('[formspree contact] fetch error:', err));
    } else {
      console.warn('[formspree contact] FORMSPREE_CONTACT_ID not set — email skipped');
    }
    res.status(201).json({ success: true, id: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(messages);
});

router.patch('/:id/read', requireAdmin, async (req, res) => {
  try {
    await prisma.contactMessage.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
