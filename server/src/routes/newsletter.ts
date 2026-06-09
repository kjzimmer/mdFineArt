import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/subscribe', async (req, res) => {
  const { name, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const person = await prisma.person.upsert({
      where: { email },
      update: name ? { name } : {},
      create: { name: name || email, email },
    });

    await prisma.newsletterSubscriber.upsert({
      where: { personId: person.id },
      update: { active: true },
      create: { personId: person.id, source: 'website', active: true },
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

router.get('/subscribers', requireAdmin, async (_req, res) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    include: { person: true },
    orderBy: { subscribedAt: 'desc' },
  });
  res.json(subscribers);
});

router.post('/unsubscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const person = await prisma.person.findUnique({ where: { email } });
    if (!person) return res.json({ success: true }); // silently ok — no account to unsubscribe
    await prisma.newsletterSubscriber.updateMany({
      where: { personId: person.id },
      data: { active: false },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

router.patch('/subscribers/:id', requireAdmin, async (req, res) => {
  try {
    const { active } = req.body;
    const updated = await prisma.newsletterSubscriber.update({
      where: { id: req.params.id },
      data: { active },
      include: { person: true },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
