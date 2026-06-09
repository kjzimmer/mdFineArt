import { Router } from 'express';
import { Readable } from 'stream';
import { prisma } from '../prisma';
import { deleteObjects } from '../lib/r2';

const router = Router();

router.get('/', async (req, res) => {
  const { subject, status, search, featured } = req.query;
  const where: any = {};

  if (status && status !== 'All') {
    where.status = String(status).toUpperCase();
  }
  if (subject && subject !== 'All') {
    where.subject = String(subject);
  }
  if (featured === 'true') {
    where.featured = true;
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

router.get('/:id/download', async (req, res) => {
  const painting = await prisma.painting.findUnique({
    where: { id: req.params.id },
    select: { fullResUrl: true, slug: true },
  });
  if (!painting?.fullResUrl) return res.status(404).json({ error: 'No original available' });
  if (!painting.fullResUrl.startsWith('http')) return res.status(400).json({ error: 'No R2 original' });

  const upstream = await fetch(painting.fullResUrl);
  if (!upstream.ok) return res.status(502).json({ error: 'Could not fetch from storage' });

  const ext = painting.fullResUrl.split('.').pop() ?? 'bin';
  const filename = `${painting.slug ?? 'painting'}.${ext}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', upstream.headers.get('Content-Type') ?? 'application/octet-stream');
  const cl = upstream.headers.get('Content-Length');
  if (cl) res.setHeader('Content-Length', cl);

  Readable.fromWeb(upstream.body as any).pipe(res);
});

router.get('/meta/options', async (req, res) => {
  const [dimRows, medRows] = await Promise.all([
    prisma.painting.findMany({
      where: { dimensions: { not: null } },
      select: { dimensions: true },
      distinct: ['dimensions'],
      orderBy: { dimensions: 'asc' },
    }),
    prisma.painting.findMany({
      where: { medium: { not: null } },
      select: { medium: true },
      distinct: ['medium'],
      orderBy: { medium: 'asc' },
    }),
  ]);
  res.json({
    dimensions: dimRows.map((r) => r.dimensions).filter(Boolean),
    mediums: medRows.map((r) => r.medium).filter(Boolean),
  });
});

router.get('/:id', async (req, res) => {
  const painting = await prisma.painting.findFirst({
    where: { OR: [{ slug: req.params.id }, { id: req.params.id }] },
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
    originalWidth,
    originalHeight,
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
      originalWidth: originalWidth ? Number(originalWidth) : null,
      originalHeight: originalHeight ? Number(originalHeight) : null,
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
    originalWidth,
    originalHeight,
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
        originalWidth: originalWidth ? Number(originalWidth) : null,
        originalHeight: originalHeight ? Number(originalHeight) : null,
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
    const painting = await prisma.painting.findUnique({ where: { id: req.params.id } });
    if (!painting) return res.status(404).json({ error: 'Painting not found' });

    await prisma.painting.delete({ where: { id: req.params.id } });
    await deleteObjects([painting.imageUrl, painting.thumbUrl, painting.fullResUrl]);

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Painting not found' });
  }
});

export default router;
