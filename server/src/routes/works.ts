import { Router } from 'express';
import { Readable } from 'stream';
import { prisma } from '../prisma';
import { deleteObjects } from '../lib/r2';

const router = Router();

router.get('/', async (req, res) => {
  const { subject, status, search, featured, mediaType } = req.query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { galleryId: req.gallery!.id };

  if (status && status !== 'All') {
    where.status = String(status).toUpperCase();
  }
  if (subject && subject !== 'All') {
    where.subject = String(subject);
  }
  if (mediaType && mediaType !== 'All') {
    where.mediaType = String(mediaType);
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

  const works = await prisma.work.findMany({
    where,
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  res.json(works);
});

router.get('/:id/download', async (req, res) => {
  const work = await prisma.work.findFirst({
    where: { id: String(req.params.id), galleryId: req.gallery!.id },
    select: { fullResUrl: true, title: true },
  });
  if (!work?.fullResUrl) return res.status(404).json({ error: 'No original available' });
  if (!work.fullResUrl.startsWith('http')) return res.status(400).json({ error: 'No R2 original' });

  const upstream = await fetch(work.fullResUrl);
  if (!upstream.ok) return res.status(502).json({ error: 'Could not fetch from storage' });

  const ext = work.fullResUrl.split('.').pop() ?? 'bin';
  const cleanName = work.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${cleanName}.${ext}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', upstream.headers.get('Content-Type') ?? 'application/octet-stream');
  const cl = upstream.headers.get('Content-Length');
  if (cl) res.setHeader('Content-Length', cl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Readable.fromWeb(upstream.body as any).pipe(res);
});

router.get('/meta/options', async (req, res) => {
  const galleryId = req.gallery!.id;
  const [dimRows, medRows, subRows] = await Promise.all([
    prisma.work.findMany({
      where: { galleryId, dimensions: { not: null } },
      select: { dimensions: true },
      distinct: ['dimensions'],
      orderBy: { dimensions: 'asc' },
    }),
    prisma.work.findMany({
      where: { galleryId, medium: { not: null } },
      select: { medium: true },
      distinct: ['medium'],
      orderBy: { medium: 'asc' },
    }),
    prisma.work.findMany({
      where: { galleryId, subject: { not: '' } },
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    }),
  ]);
  res.json({
    dimensions: dimRows.map((r) => r.dimensions).filter(Boolean),
    mediums: medRows.map((r) => r.medium).filter(Boolean),
    subjects: subRows.map((r) => r.subject).filter(Boolean),
  });
});

router.get('/:id', async (req, res) => {
  const work = await prisma.work.findFirst({
    where: {
      galleryId: req.gallery!.id,
      OR: [{ slug: String(req.params.id) }, { id: String(req.params.id) }],
    },
  });

  if (!work) return res.status(404).json({ error: 'Work not found' });
  res.json(work);
});

router.post('/', async (req, res) => {
  const {
    title, slug, status, subject, mediaType, tags, year, dimensions, medium, price,
    originalWidth, originalHeight, imageUrl, fullResUrl, thumbUrl,
    printsAvailable, featured, description,
  } = req.body;

  if (!title || !slug || !imageUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const work = await prisma.work.create({
    data: {
      galleryId: req.gallery!.id,
      title,
      slug,
      status: (String(status || 'AVAILABLE').toUpperCase() as unknown) as 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NFS',
      subject: subject ?? '',
      mediaType: mediaType ?? null,
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

  res.status(201).json(work);
});

router.put('/:id', async (req, res) => {
  const {
    title, slug, status, subject, mediaType, tags, year, dimensions, medium, price,
    originalWidth, originalHeight, imageUrl, fullResUrl, thumbUrl,
    printsAvailable, featured, description,
  } = req.body;

  try {
    const work = await prisma.work.update({
      where: { id: String(req.params.id) },
      data: {
        title,
        slug,
        status: (String(status || 'AVAILABLE').toUpperCase() as unknown) as 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NFS',
        subject: subject ?? '',
        mediaType: mediaType ?? null,
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
    res.json(work);
  } catch {
    res.status(404).json({ error: 'Work not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const work = await prisma.work.findFirst({
      where: { id: String(req.params.id), galleryId: req.gallery!.id },
    });
    if (!work) return res.status(404).json({ error: 'Work not found' });

    await prisma.work.delete({ where: { id: String(req.params.id) } });
    await deleteObjects([work.imageUrl, work.thumbUrl, work.fullResUrl]);

    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Work not found' });
  }
});

export default router;
