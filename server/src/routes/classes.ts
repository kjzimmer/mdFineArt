import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Public — published offerings sorted by sortOrder
router.get('/', async (req, res) => {
  const offerings = await prisma.classOffering.findMany({
    where: { galleryId: req.gallery!.id, published: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(offerings);
});

// Admin — all offerings
router.get('/all', requireAdmin, async (req, res) => {
  const offerings = await prisma.classOffering.findMany({
    where: { galleryId: req.gallery!.id },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(offerings);
});

router.post('/', requireAdmin, async (req, res) => {
  const { label, heading, description, inquireSubject, sortOrder, published } = req.body;
  if (!label || !heading || !description || !inquireSubject) {
    return res.status(400).json({ error: 'label, heading, description, and inquireSubject are required' });
  }
  try {
    const offering = await prisma.classOffering.create({
      data: {
        galleryId: req.gallery!.id,
        label,
        heading,
        description,
        inquireSubject,
        sortOrder: Number(sortOrder) || 0,
        published: published !== false,
      },
    });
    res.status(201).json(offering);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class offering' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { label, heading, description, inquireSubject, sortOrder, published } = req.body;
  try {
    const offering = await prisma.classOffering.update({
      where: { id: String(req.params.id) },
      data: {
        ...(label !== undefined && { label }),
        ...(heading !== undefined && { heading }),
        ...(description !== undefined && { description }),
        ...(inquireSubject !== undefined && { inquireSubject }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(published !== undefined && { published: Boolean(published) }),
      },
    });
    res.json(offering);
  } catch {
    res.status(404).json({ error: 'Class offering not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.classOffering.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Class offering not found' });
  }
});

export default router;
