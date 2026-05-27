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
    const record = await prisma.commissionRequest.create({
      data: { name, email, phone: phone || null, subject, description },
    });
    const formspreeId = process.env.FORMSPREE_COMMISSION_ID;
    if (formspreeId) {
      fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, description }),
      }).catch(() => {});
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

export default router;
