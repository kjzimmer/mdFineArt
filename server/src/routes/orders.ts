import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const orderInclude = {
  person: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      painting: { select: { id: true, title: true, thumbUrl: true, imageUrl: true } },
    },
  },
};

router.get('/', requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { galleryId: req.gallery!.id },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.post('/', requireAdmin, async (req, res) => {
  const { personId, items, notes } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  const amount = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
    sum + item.quantity * item.unitPrice, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          galleryId: req.gallery!.id,
          personId: personId || null,
          amount,
          notes: notes || null,
          status: 'INVOICE_SENT',
          items: {
            create: items.map((item: {
              paintingId?: string; printProductId?: string;
              label: string; quantity: number; unitPrice: number;
            }) => ({
              paintingId: item.paintingId || null,
              printProductId: item.printProductId || null,
              label: item.label,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      // Mark original paintings as RESERVED
      const paintingIds = items
        .filter((i: { paintingId?: string }) => i.paintingId)
        .map((i: { paintingId: string }) => i.paintingId);
      if (paintingIds.length > 0) {
        await tx.painting.updateMany({
          where: { id: { in: paintingIds } },
          data: { status: 'RESERVED' },
        });
      }

      return created;
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { status, notes } = req.body;
  try {
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: String(req.params.id) },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
        include: orderInclude,
      });

      if (status === 'PAID' || status === 'CANCELLED') {
        const paintingIds = updated.items
          .filter((i) => i.paintingId)
          .map((i) => i.paintingId as string);
        if (paintingIds.length > 0) {
          await tx.painting.updateMany({
            where: { id: { in: paintingIds } },
            data: { status: status === 'PAID' ? 'SOLD' : 'AVAILABLE' },
          });
        }
      }

      return updated;
    });

    res.json(order);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: { items: { select: { paintingId: true } } },
    });
    if (order && (order.status === 'INVOICE_SENT' || order.status === 'DRAFT')) {
      const paintingIds = order.items.filter((i) => i.paintingId).map((i) => i.paintingId as string);
      if (paintingIds.length > 0) {
        await prisma.painting.updateMany({ where: { id: { in: paintingIds } }, data: { status: 'AVAILABLE' } });
      }
    }
    await prisma.order.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// Fetch print products for a painting (used by invoice modal)
router.get('/print-products/:paintingId', requireAdmin, async (req, res) => {
  const products = await prisma.printProduct.findMany({
    where: { paintingId: String(req.params.paintingId), galleryId: req.gallery!.id },
    orderBy: { size: 'asc' },
  });
  res.json(products);
});

export default router;
