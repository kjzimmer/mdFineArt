import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const orderInclude = {
  person: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      work: { select: { id: true, title: true, thumbUrl: true, imageUrl: true } },
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
              workId?: string; printProductId?: string;
              label: string; quantity: number; unitPrice: number;
            }) => ({
              workId: item.workId || null,
              printProductId: item.printProductId || null,
              label: item.label,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });

      // Mark original works as RESERVED
      const workIds = items
        .filter((i: { workId?: string }) => i.workId)
        .map((i: { workId: string }) => i.workId);
      if (workIds.length > 0) {
        await tx.work.updateMany({
          where: { id: { in: workIds } },
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
        const workIds = updated.items
          .filter((i) => i.workId)
          .map((i) => i.workId as string);
        if (workIds.length > 0) {
          await tx.work.updateMany({
            where: { id: { in: workIds } },
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
      include: { items: { select: { workId: true } } },
    });
    if (order && (order.status === 'INVOICE_SENT' || order.status === 'DRAFT')) {
      const workIds = order.items.filter((i) => i.workId).map((i) => i.workId as string);
      if (workIds.length > 0) {
        await prisma.work.updateMany({ where: { id: { in: workIds } }, data: { status: 'AVAILABLE' } });
      }
    }
    await prisma.order.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// Fetch print products for a work (used by invoice modal)
router.get('/print-products/:workId', requireAdmin, async (req, res) => {
  const products = await prisma.printProduct.findMany({
    where: { workId: String(req.params.workId), galleryId: req.gallery!.id },
    orderBy: { size: 'asc' },
  });
  res.json(products);
});

export default router;
