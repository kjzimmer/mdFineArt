import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  const galleryId = req.gallery!.id;
  // People are global — return those who have interacted with this gallery
  const people = await prisma.person.findMany({
    where: {
      OR: [
        { contacts: { some: { galleryId } } },
        { commissions: { some: { galleryId } } },
        { newsletter: { galleryId } },
        { orders: { some: { galleryId } } },
        { galleryLinks: { some: { galleryId } } },
      ],
    },
    include: {
      _count: { select: { contacts: true, commissions: true } },
      newsletter: { select: { active: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(people);
});

// Manually create a person — the only path into People besides an inbound contact,
// commission, newsletter signup, or order. If the email already exists globally (e.g. they
// contacted a different gallery), links the existing record into this gallery instead of
// erroring, since email is globally unique.
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, phone, shippingAddress, notes } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'Email is required' });

  const galleryId = req.gallery!.id;
  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const person = await prisma.person.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: phone || null,
        shippingAddress: shippingAddress || null,
        notes: notes || null,
      },
    });

    await prisma.personGalleryLink.upsert({
      where: { personId_galleryId: { personId: person.id, galleryId } },
      update: {},
      create: { personId: person.id, galleryId },
    });

    res.status(201).json(person);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  const galleryId = req.gallery!.id;
  const person = await prisma.person.findUnique({
    where: { id: String(req.params.id) },
    include: {
      contacts: { where: { galleryId }, orderBy: { createdAt: 'desc' } },
      commissions: { where: { galleryId }, orderBy: { createdAt: 'desc' } },
      newsletter: true,
    },
  });
  if (!person) return res.status(404).json({ error: 'Not found' });
  res.json(person);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, shippingAddress, notes, tags } = req.body;
    const galleryId = req.gallery!.id;
    const updated = await prisma.person.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(shippingAddress !== undefined && { shippingAddress }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        contacts: { where: { galleryId }, orderBy: { createdAt: 'desc' } },
        commissions: { where: { galleryId }, orderBy: { createdAt: 'desc' } },
        newsletter: true,
      },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.person.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
