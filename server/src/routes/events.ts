import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Public — published events sorted by date asc
router.get('/', async (req, res) => {
  const events = await prisma.event.findMany({
    where: { galleryId: req.gallery!.id, published: true },
    orderBy: { date: 'asc' },
  });
  res.json(events);
});

// Admin — all events including unpublished
router.get('/all', requireAdmin, async (req, res) => {
  const events = await prisma.event.findMany({
    where: { galleryId: req.gallery!.id },
    orderBy: { date: 'asc' },
  });
  res.json(events);
});

router.post('/', requireAdmin, async (req, res) => {
  const { title, date, time, venue, description, externalLink, imageUrl, published } = req.body;
  if (!title || !date || !venue) {
    return res.status(400).json({ error: 'title, date, and venue are required' });
  }
  try {
    const event = await prisma.event.create({
      data: {
        galleryId: req.gallery!.id,
        title,
        date: new Date(date),
        time: time || null,
        venue,
        description: description || null,
        externalLink: externalLink || null,
        imageUrl: imageUrl || null,
        published: Boolean(published),
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { title, date, time, venue, description, externalLink, imageUrl, published } = req.body;
  try {
    const event = await prisma.event.update({
      where: { id: String(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(time !== undefined && { time: time || null }),
        ...(venue !== undefined && { venue }),
        ...(description !== undefined && { description: description || null }),
        ...(externalLink !== undefined && { externalLink: externalLink || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(published !== undefined && { published: Boolean(published) }),
      },
    });
    res.json(event);
  } catch {
    res.status(404).json({ error: 'Event not found' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Event not found' });
  }
});

export default router;
