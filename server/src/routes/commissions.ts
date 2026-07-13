import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { submitCommission } from '../services/ContactService';
import { formSubmitLimit } from '../middleware/rateLimit';

const router = Router();

router.post('/', formSubmitLimit, async (req, res) => {
  const { name, email, phone, subject, description } = req.body;
  if (!name || !email || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const record = await submitCommission({ name, email, phone, subject, description });
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
      where: { id: String(req.params.id) },
      data: { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
