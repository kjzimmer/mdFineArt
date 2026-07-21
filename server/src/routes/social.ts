import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  const links = await prisma.socialLink.findMany({
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(links);
});

router.post('/', requireAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  const last = await prisma.socialLink.findFirst({ orderBy: { position: 'desc' } });

  const link = await prisma.socialLink.create({
    data: { url: String(url), position: last ? last.position + 1 : 0 },
  });
  res.status(201).json(link);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { url } = req.body;
  try {
    const link = await prisma.socialLink.update({
      where: { id: String(req.params.id) },
      data: { url: String(url) },
    });
    res.json(link);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

router.post('/:id/move', requireAdmin, async (req, res) => {
  const { direction } = req.body as { direction: 'up' | 'down' };
  const link = await prisma.socialLink.findUnique({ where: { id: String(req.params.id) } });
  if (!link) return res.status(404).json({ error: 'Not found' });

  const neighbor = await prisma.socialLink.findFirst({
    where: { position: direction === 'up' ? { lt: link.position } : { gt: link.position } },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });

  if (!neighbor) return res.json({ success: true });

  await prisma.$transaction([
    prisma.socialLink.update({ where: { id: link.id }, data: { position: neighbor.position } }),
    prisma.socialLink.update({ where: { id: neighbor.id }, data: { position: link.position } }),
  ]);
  res.json({ success: true });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.socialLink.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
