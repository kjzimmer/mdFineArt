import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      person: { select: { id: true, name: true, email: true } },
      painting: { select: { id: true, title: true, imageUrl: true, thumbUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.post('/', requireAdmin, async (req, res) => {
  const { personId, paintingId, amount, notes } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount is required' });

  try {
    const order = await prisma.order.create({
      data: {
        personId: personId || null,
        paintingId: paintingId || null,
        amount: parseFloat(amount),
        notes: notes || null,
        status: 'INVOICE_SENT',
      },
      include: {
        person: { select: { id: true, name: true, email: true } },
        painting: { select: { id: true, title: true, imageUrl: true, thumbUrl: true } },
      },
    });

    // Mark painting as RESERVED when invoice is sent
    if (paintingId) {
      await prisma.painting.update({
        where: { id: paintingId },
        data: { status: 'RESERVED' },
      });
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { status, notes } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        person: { select: { id: true, name: true, email: true } },
        painting: { select: { id: true, title: true, imageUrl: true, thumbUrl: true } },
      },
    });

    // Mark painting SOLD when order is paid, AVAILABLE if cancelled
    if (order.paintingId) {
      if (status === 'PAID') {
        await prisma.painting.update({ where: { id: order.paintingId }, data: { status: 'SOLD' } });
      } else if (status === 'CANCELLED') {
        await prisma.painting.update({ where: { id: order.paintingId }, data: { status: 'AVAILABLE' } });
      }
    }

    res.json(order);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (order?.paintingId && (order.status === 'INVOICE_SENT' || order.status === 'DRAFT')) {
      await prisma.painting.update({ where: { id: order.paintingId }, data: { status: 'AVAILABLE' } });
    }
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
