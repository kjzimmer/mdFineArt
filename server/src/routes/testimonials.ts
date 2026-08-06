import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { deleteObjects } from '../lib/r2';

const router = Router();

// Public — published testimonials for a context, sorted by sortOrder
router.get('/:context', async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { galleryId: req.gallery!.id, context: String(req.params.context), published: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(testimonials);
});

// Admin — all testimonials for a context
router.get('/:context/all', requireAdmin, async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { galleryId: req.gallery!.id, context: String(req.params.context) },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(testimonials);
});

router.post('/:context', requireAdmin, async (req, res) => {
  const { authorName, authorDetail, quote, photoUrl, sortOrder, published } = req.body;
  if (!authorName || !quote) {
    return res.status(400).json({ error: 'authorName and quote are required' });
  }
  try {
    const testimonial = await prisma.testimonial.create({
      data: {
        galleryId: req.gallery!.id,
        context: String(req.params.context),
        authorName,
        authorDetail: authorDetail || null,
        quote,
        photoUrl: photoUrl || null,
        sortOrder: Number(sortOrder) || 0,
        published: published !== false,
      },
    });
    res.status(201).json(testimonial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { authorName, authorDetail, quote, photoUrl, sortOrder, published } = req.body;
  try {
    const testimonial = await prisma.testimonial.update({
      where: { id: String(req.params.id) },
      data: {
        ...(authorName !== undefined && { authorName }),
        ...(authorDetail !== undefined && { authorDetail: authorDetail || null }),
        ...(quote !== undefined && { quote }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(published !== undefined && { published: Boolean(published) }),
      },
    });
    res.json(testimonial);
  } catch {
    res.status(404).json({ error: 'Testimonial not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const testimonial = await prisma.testimonial.findUnique({ where: { id: String(req.params.id) } });
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    await prisma.testimonial.delete({ where: { id: String(req.params.id) } });
    await deleteObjects([testimonial.photoUrl]);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Testimonial not found' });
  }
});

export default router;
