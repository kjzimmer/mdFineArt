import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { submitContact } from '../services/ContactService';
import { formSubmitLimit } from '../middleware/rateLimit';

const router = Router();

router.post('/', formSubmitLimit, async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const record = await submitContact({ galleryId: req.gallery!.id, name, email, phone, subject, message });
    res.status(201).json({ success: true, id: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  const messages = await prisma.contactMessage.findMany({
    where: { galleryId: req.gallery!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(messages);
});

router.patch('/:id/read', requireAdmin, async (req, res) => {
  try {
    await prisma.contactMessage.update({ where: { id: String(req.params.id) }, data: { read: true } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
