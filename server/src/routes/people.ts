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
    const { name, email, phone, notes, tags } = req.body;
    const galleryId = req.gallery!.id;
    const updated = await prisma.person.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
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
