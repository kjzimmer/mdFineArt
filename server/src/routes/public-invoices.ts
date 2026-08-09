import { Router } from 'express';
import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { sendPaymentConfirmationEmail } from '../services/EmailService';
import { getContactEmail } from '../services/ContactService';

const router = Router();

const SQUARE_APP_ID = process.env.SQUARE_APP_ID!;
const SQUARE_ENVIRONMENT = (process.env.SQUARE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

// GET /api/invoices/public/:token
// Returns invoice details + Square SDK config needed to render the payment page.
// No auth — accessible to collectors via the invoice link.
router.get('/:token', async (req, res) => {
  const token = String(req.params.token);

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      gallery: {
        select: {
          name: true,
          squareLocationId: true,
          customDomain: true,
          previewDomain: true,
          config: { select: { logoUrl: true, contactPhone: true, businessAddress: true } },
        },
      },
      person: { select: { name: true, phone: true, shippingAddress: true } },
      items: {
        include: { work: { select: { title: true } } },
      },
    },
  });

  if (!order) return res.status(404).json({ error: 'Invoice not found' });
  if (order.status === 'CANCELLED') return res.status(410).json({ error: 'This invoice has been cancelled' });

  const galleryUrl = order.gallery.customDomain || order.gallery.previewDomain;

  res.json({
    invoice: serializeOrder(order),
    gallery: {
      name: order.gallery.name,
      logoUrl: order.gallery.config?.logoUrl ?? null,
      phone: order.gallery.config?.contactPhone ?? null,
      address: order.gallery.config?.businessAddress ?? null,
      url: galleryUrl ? `https://${galleryUrl}` : null,
    },
    square: {
      appId: SQUARE_APP_ID,
      locationId: order.gallery.squareLocationId,
      environment: SQUARE_ENVIRONMENT,
    },
  });
});

// POST /api/invoices/public/:token/pay
// Accepts a Square card nonce (sourceId) and processes the payment.
router.post('/:token/pay', async (req, res) => {
  const token = String(req.params.token);
  const { sourceId } = req.body as { sourceId?: string };

  if (!sourceId) return res.status(400).json({ error: 'sourceId required' });

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      gallery: {
        select: { squareAccessToken: true, squareLocationId: true, name: true },
      },
      person: { select: { name: true, email: true } },
      items: { select: { workId: true, label: true, quantity: true, unitPrice: true, work: { select: { title: true } } } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Invoice not found' });
  if (order.status === 'PAID') return res.status(409).json({ error: 'This invoice has already been paid' });
  if (order.status === 'CANCELLED') return res.status(410).json({ error: 'This invoice has been cancelled' });
  if (!order.gallery.squareAccessToken || !order.gallery.squareLocationId) {
    return res.status(503).json({ error: 'Payment processing not configured for this gallery' });
  }

  const squareClient = new SquareClient({
    token: order.gallery.squareAccessToken,
    environment: SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  });

  try {
    const result = await squareClient.payments.create({
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(order.amount * 100)),
        currency: 'USD',
      },
      locationId: order.gallery.squareLocationId,
      referenceId: order.id,
      note: order.person?.name ? `Invoice payment from ${order.person.name}` : 'Invoice payment',
      idempotencyKey: crypto.randomUUID(),
    });

    const paymentId = result.payment?.id ?? null;

    // Mark order paid and work items sold in one transaction
    const workIds = order.items.map((i) => i.workId).filter((id): id is string => !!id);

    const paidAt = new Date();

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', squarePaymentId: paymentId, paidAt },
      }),
      ...(workIds.length > 0
        ? [prisma.work.updateMany({ where: { id: { in: workIds } }, data: { status: 'SOLD' } })]
        : []),
    ]);

    if (order.person?.name && order.person?.email) {
      const replyTo = await getContactEmail(order.galleryId);
      sendPaymentConfirmationEmail({
        to: order.person.email,
        recipientName: order.person.name,
        galleryName: order.gallery.name,
        amount: order.amount,
        paidAt,
        items: order.items,
        replyTo: replyTo ?? undefined,
      }).catch((err) => console.error('Payment confirmation email error:', err));
    }

    res.json({ paymentId, status: result.payment?.status });
  } catch (err: unknown) {
    console.error('Square payment error:', err);
    const message = err instanceof Error ? err.message : 'Payment processing failed';
    res.status(402).json({ error: message });
  }
});

function serializeOrder(order: {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  amount: number;
  notes: string | null;
  createdAt: Date;
  sentAt: Date | null;
  paidAt: Date | null;
  items: Array<{ id: string; label: string; quantity: number; unitPrice: number; work: { title: string | null } | null }>;
  person: { name: string; phone: string | null; shippingAddress: string | null } | null;
}) {
  return {
    id: order.id,
    status: order.status,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    amount: order.amount,
    notes: order.notes,
    createdAt: order.createdAt,
    sentAt: order.sentAt,
    paidAt: order.paidAt,
    items: order.items.map((item) => ({
      id: item.id,
      label: item.label,
      workTitle: item.work?.title ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    person: order.person,
  };
}

export default router;
