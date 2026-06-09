import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const personInclude = {
  contacts: { orderBy: { createdAt: 'desc' } as const },
  commissions: { orderBy: { createdAt: 'desc' } as const },
  newsletter: true,
};

router.get('/', requireAdmin, async (_req, res) => {
  const people = await prisma.person.findMany({
    include: {
      _count: { select: { contacts: true, commissions: true } },
      newsletter: { select: { active: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(people);
});

router.get('/:id', requireAdmin, async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: req.params.id },
    include: personInclude,
  });
  if (!person) return res.status(404).json({ error: 'Not found' });
  res.json(person);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, notes, tags } = req.body;
    const updated = await prisma.person.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
      },
      include: personInclude,
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.person.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
