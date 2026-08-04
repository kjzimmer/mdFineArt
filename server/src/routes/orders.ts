import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { sendInvoiceEmail, sendPaymentConfirmationEmail } from '../services/EmailService';

const router = Router();

const orderInclude = {
  person: { select: { id: true, name: true, email: true } },
  items: {
    select: {
      id: true,
      label: true,
      quantity: true,
      unitPrice: true,
      printProductId: true,
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
  const { personId, items, notes, tax, shipping } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
    0,
  );
  const taxAmt = Number(tax) || 0;
  const shippingAmt = Number(shipping) || 0;
  const amount = subtotal + taxAmt + shippingAmt;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          galleryId: req.gallery!.id,
          personId: personId || null,
          subtotal,
          tax: taxAmt,
          shipping: shippingAmt,
          amount,
          notes: notes || null,
          status: 'DRAFT',
          publicToken: crypto.randomUUID(),
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

// Send invoice email and transition to INVOICE_SENT
router.post('/:id/send', requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      person: { select: { name: true, email: true } },
      gallery: {
        select: {
          name: true,
          customDomain: true,
          previewDomain: true,
          config: { select: { contactPhone: true, businessAddress: true } },
        },
      },
      items: { select: { label: true, quantity: true, unitPrice: true } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'PAID') return res.status(409).json({ error: 'Invoice already paid' });
  if (order.status === 'CANCELLED') return res.status(410).json({ error: 'Invoice cancelled' });
  if (!order.person?.email) return res.status(400).json({ error: 'Customer has no email address' });

  const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
  const invoiceUrl = `${baseUrl}/invoice/${order.publicToken}`;
  const galleryHost = order.gallery.customDomain || order.gallery.previewDomain;

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'INVOICE_SENT', sentAt: new Date() },
    include: orderInclude,
  });

  sendInvoiceEmail({
    to: order.person.email,
    recipientName: order.person.name,
    galleryName: order.gallery.name,
    invoiceUrl,
    amount: order.amount,
    items: order.items,
    notes: order.notes,
    bcc: req.body?.bcc && req.admin?.email ? req.admin.email : undefined,
    galleryAddress: order.gallery.config?.businessAddress ?? undefined,
    galleryPhone: order.gallery.config?.contactPhone ?? undefined,
    galleryUrl: galleryHost ? `https://${galleryHost}` : undefined,
  }).catch((err) => console.error('Invoice email error:', err));

  res.json(updated);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { status, notes, personId, items, tax, shipping } = req.body;
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: String(req.params.id) },
        include: { items: { select: { workId: true } } },
      });
      if (!existing) throw new Error('Not found');

      // Full draft edit when items array is provided and order is still a draft
      if (items && Array.isArray(items) && existing.status === 'DRAFT') {
        const oldWorkIds = existing.items.filter((i) => i.workId).map((i) => i.workId as string);
        if (oldWorkIds.length > 0) {
          await tx.work.updateMany({ where: { id: { in: oldWorkIds } }, data: { status: 'AVAILABLE' } });
        }
        await tx.orderItem.deleteMany({ where: { orderId: existing.id } });

        const newSubtotal = (items as Array<{ quantity: number; unitPrice: number }>)
          .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
        const newTax = Number(tax) || 0;
        const newShipping = Number(shipping) || 0;

        const updated = await tx.order.update({
          where: { id: existing.id },
          data: {
            ...(personId !== undefined && { personId: personId || null }),
            ...(notes !== undefined && { notes: notes || null }),
            tax: newTax,
            shipping: newShipping,
            subtotal: newSubtotal,
            amount: newSubtotal + newTax + newShipping,
            items: {
              create: (items as Array<{
                workId?: string; printProductId?: string;
                label: string; quantity: number; unitPrice: number;
              }>).map((i) => ({
                workId: i.workId || null,
                printProductId: i.printProductId || null,
                label: i.label,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
            },
          },
          include: orderInclude,
        });

        const newWorkIds = (items as Array<{ workId?: string }>)
          .filter((i) => i.workId).map((i) => i.workId as string);
        if (newWorkIds.length > 0) {
          await tx.work.updateMany({ where: { id: { in: newWorkIds } }, data: { status: 'RESERVED' } });
        }
        return updated;
      }

      // Status / notes only update
      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
        include: orderInclude,
      });

      if (status === 'PAID' || status === 'CANCELLED') {
        const workIds = updated.items
          .filter((i) => i.work)
          .map((i) => i.work!.id);
        if (workIds.length > 0) {
          await tx.work.updateMany({
            where: { id: { in: workIds } },
            data: { status: status === 'PAID' ? 'SOLD' : 'AVAILABLE' },
          });
        }
      }

      return updated;
    });

    if (status === 'PAID' && order.person?.email) {
      const gallery = await prisma.gallery.findUnique({
        where: { id: req.gallery!.id },
        select: { name: true },
      });
      if (gallery) {
        sendPaymentConfirmationEmail({
          to: order.person.email,
          recipientName: order.person.name,
          galleryName: gallery.name,
          amount: order.amount,
          paidAt: new Date(),
          items: order.items.map((i) => ({ label: i.label, quantity: i.quantity, unitPrice: i.unitPrice })),
        }).catch((err) => console.error('Payment confirmation email error:', err));
      }
    }

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
