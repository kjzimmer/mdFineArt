import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { deleteObjects } from '../lib/r2';

const router = Router();

router.get('/:context', async (req, res) => {
  const slides = await prisma.slideshowSlide.findMany({
    where: { context: String(req.params.context) },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(slides);
});

router.post('/:context', requireAdmin, async (req, res) => {
  const { imageUrl, thumbUrl, fullResUrl, caption } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

  const last = await prisma.slideshowSlide.findFirst({
    where: { context: String(req.params.context) },
    orderBy: { position: 'desc' },
  });

  const slide = await prisma.slideshowSlide.create({
    data: {
      context: String(req.params.context),
      imageUrl: String(imageUrl),
      thumbUrl: thumbUrl ? String(thumbUrl) : null,
      fullResUrl: fullResUrl ? String(fullResUrl) : null,
      caption: caption ? String(caption) : null,
      position: last ? last.position + 1 : 0,
    },
  });
  res.status(201).json(slide);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { caption } = req.body;
  try {
    const slide = await prisma.slideshowSlide.update({
      where: { id: String(req.params.id) },
      data: { caption: caption != null ? String(caption) : null },
    });
    res.json(slide);
  } catch {
    res.status(404).json({ error: 'Slide not found' });
  }
});

router.post('/:id/move', requireAdmin, async (req, res) => {
  const { direction } = req.body as { direction: 'up' | 'down' };
  const slide = await prisma.slideshowSlide.findUnique({ where: { id: String(req.params.id) } });
  if (!slide) return res.status(404).json({ error: 'Slide not found' });

  const neighbor = await prisma.slideshowSlide.findFirst({
    where: {
      context: slide.context,
      position: direction === 'up' ? { lt: slide.position } : { gt: slide.position },
    },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });

  if (!neighbor) return res.json({ success: true }); // already at edge

  await prisma.$transaction([
    prisma.slideshowSlide.update({ where: { id: slide.id }, data: { position: neighbor.position } }),
    prisma.slideshowSlide.update({ where: { id: neighbor.id }, data: { position: slide.position } }),
  ]);

  res.json({ success: true });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const slide = await prisma.slideshowSlide.findUnique({ where: { id: String(req.params.id) } });
    if (!slide) return res.status(404).json({ error: 'Slide not found' });
    await prisma.slideshowSlide.delete({ where: { id: String(req.params.id) } });
    await deleteObjects([slide.imageUrl, slide.thumbUrl, slide.fullResUrl]);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Slide not found' });
  }
});

export default router;
