import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const { subject, status, search } = req.query;
  const where: any = {};

  if (status && status !== 'All') {
    where.status = String(status).toUpperCase();
  }
  if (subject && subject !== 'All') {
    where.subject = String(subject);
  }
  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const paintings = await prisma.painting.findMany({
    where,
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  res.json(paintings);
});

router.get('/:id', async (req, res) => {
  const painting = await prisma.painting.findUnique({
    where: { id: req.params.id },
  });

  if (!painting) return res.status(404).json({ error: 'Painting not found' });
  res.json(painting);
});

router.post('/', async (req, res) => {
  const {
    title,
    slug,
    status,
    subject,
    tags,
    year,
    dimensions,
    medium,
    price,
    priceLabel,
    imageUrl,
    fullResUrl,
    thumbUrl,
    printsAvailable,
    featured,
    description,
  } = req.body;

  if (!title || !slug || !subject || !imageUrl) {
    return res.status(400).json({ error: 'Missing required painting fields' });
  }

  const painting = await prisma.painting.create({
    data: {
      title,
      slug,
      status: (String(status || 'AVAILABLE').toUpperCase() as unknown) as 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NFS',
      subject,
      tags: Array.isArray(tags) ? tags : [],
      year: year ? Number(year) : null,
      dimensions: dimensions ?? null,
      medium: medium ?? null,
      price: price !== undefined && price !== null ? Number(price) : null,
      priceLabel: priceLabel ?? null,
      imageUrl,
      fullResUrl: fullResUrl ?? null,
      thumbUrl: thumbUrl ?? null,
      printsAvailable: Boolean(printsAvailable),
      featured: Boolean(featured),
      description: description ?? null,
    },
  });

  res.status(201).json(painting);
});

router.put('/:id', async (req, res) => {
  const {
    title,
    slug,
    status,
    subject,
    tags,
    year,
    dimensions,
    medium,
    price,
    priceLabel,
    imageUrl,
    fullResUrl,
    thumbUrl,
    printsAvailable,
    featured,
    description,
  } = req.body;

  try {
    const painting = await prisma.painting.update({
      where: { id: req.params.id },
      data: {
        title,
        slug,
        status: (String(status || 'AVAILABLE').toUpperCase() as unknown) as 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NFS',
        subject,
        tags: Array.isArray(tags) ? tags : [],
        year: year ? Number(year) : null,
        dimensions: dimensions ?? null,
        medium: medium ?? null,
        price: price !== undefined && price !== null ? Number(price) : null,
        priceLabel: priceLabel ?? null,
        imageUrl,
        fullResUrl: fullResUrl ?? null,
        thumbUrl: thumbUrl ?? null,
        printsAvailable: Boolean(printsAvailable),
        featured: Boolean(featured),
        description: description ?? null,
      },
    });
    res.json(painting);
  } catch (error) {
    res.status(404).json({ error: 'Painting not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.painting.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Painting not found' });
  }
});

export default router;
