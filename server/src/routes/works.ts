import { Router, Request, Response } from 'express';
import { Readable } from 'stream';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { deleteObjects } from '../lib/r2';
import { getInProgressWorks } from '../lib/featuredInProgress';

const router = Router();

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function generateUniqueSlug(base: string): Promise<string> {
  let candidate = slugify(base) || `untitled-${crypto.randomUUID().slice(0, 8)}`;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.work.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${slugify(base) || 'untitled'}-${crypto.randomUUID().slice(0, 6)}`;
  }
  throw new Error('Could not generate a unique slug');
}

// Client's status <select> sends Title Case ("In Progress"); the DB enum uses SCREAMING_SNAKE
// (IN_PROGRESS). A plain .toUpperCase() would produce "IN PROGRESS" (space, not underscore)
// and fail Prisma validation — this normalizes both the casing and the separator.
function normalizeStatus(status: unknown): 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NFS' | 'IN_PROGRESS' {
  return (String(status || 'AVAILABLE').trim().toUpperCase().replace(/\s+/g, '_') as unknown) as
    'AVAILABLE' | 'SOLD' | 'RESERVED' | 'NFS' | 'IN_PROGRESS';
}

router.get('/', async (req: Request, res: Response) => {
  const { subject, status, search, featured, mediaType, includeInProgress, includeHidden } = req.query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { galleryId: req.gallery!.id };

  const wantsInProgress = includeInProgress === 'true';
  const requestedStatus = status && status !== 'All' ? String(status).toUpperCase() : null;
  if (requestedStatus && (requestedStatus !== 'IN_PROGRESS' || wantsInProgress)) {
    where.status = requestedStatus;
  } else if (!wantsInProgress) {
    where.status = { not: 'IN_PROGRESS' };
  }
  if (includeHidden !== 'true') where.showInGallery = true;

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
      { year: { sort: 'desc', nulls: 'last' } },
    ],
  });
  res.json(works);
});

router.get('/:id/download', async (req: Request, res: Response) => {
  const work = await prisma.work.findFirst({
    where: { id: String(req.params.id), galleryId: req.gallery!.id },
    select: { fullResUrl: true, title: true },
  });
  if (!work?.fullResUrl) return res.status(404).json({ error: 'No original available' });
  if (!work.fullResUrl.startsWith('http')) return res.status(400).json({ error: 'No R2 original' });

  const upstream = await fetch(work.fullResUrl);
  if (!upstream.ok) return res.status(502).json({ error: 'Could not fetch from storage' });

  const ext = work.fullResUrl.split('.').pop() ?? 'bin';
  const cleanName = slugify(work.title || 'untitled');
  const filename = `${cleanName}.${ext}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', upstream.headers.get('Content-Type') ?? 'application/octet-stream');
  const cl = upstream.headers.get('Content-Length');
  if (cl) res.setHeader('Content-Length', cl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Readable.fromWeb(upstream.body as any).pipe(res);
});

router.get('/meta/options', async (req: Request, res: Response) => {
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

// Public read of the works to show in the Home page's Works in Progress section (most
// recently active first, with each one's progress photos), for visitors. Deliberately
// separate from /api/library (admin-only, since reference photos must never be public) —
// this only ever exposes progress-role assets, and only for works actually eligible to be
// shown publicly.
router.get('/in-progress', async (req: Request, res: Response) => {
  const galleryId = req.gallery!.id;
  const config = await prisma.siteConfig.findUnique({ where: { galleryId } });
  if (!config) return res.json([]);
  res.json(await getInProgressWorks(galleryId, config));
});

router.get('/:id', async (req: Request, res: Response) => {
  const { includeInProgress, includeHidden } = req.query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    galleryId: req.gallery!.id,
    OR: [{ slug: String(req.params.id) }, { id: String(req.params.id) }],
  };
  if (includeInProgress !== 'true') where.status = { not: 'IN_PROGRESS' };
  if (includeHidden !== 'true') where.showInGallery = true;

  const work = await prisma.work.findFirst({ where });

  if (!work) return res.status(404).json({ error: 'Work not found' });
  res.json(work);
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const {
    title, slug, status, subject, mediaType, tags, year, dimensions, medium, price,
    originalWidth, originalHeight, imageUrl, fullResUrl, thumbUrl,
    printsAvailable, featured, showInGallery, description,
  } = req.body;

  const resolvedStatus = normalizeStatus(status);
  const isInProgress = resolvedStatus === 'IN_PROGRESS';

  if (!isInProgress && (!title || !imageUrl)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resolvedSlug = slug ? String(slug) : await generateUniqueSlug(title || 'untitled');

  const work = await prisma.work.create({
    data: {
      galleryId: req.gallery!.id,
      title: title || null,
      slug: resolvedSlug,
      status: resolvedStatus,
      subject: subject || null,
      mediaType: mediaType ?? null,
      tags: Array.isArray(tags) ? tags : [],
      year: year ? Number(year) : null,
      dimensions: dimensions ?? null,
      medium: medium ?? null,
      price: price !== undefined && price !== null ? Number(price) : null,
      originalWidth: originalWidth ? Number(originalWidth) : null,
      originalHeight: originalHeight ? Number(originalHeight) : null,
      imageUrl: imageUrl ?? null,
      fullResUrl: fullResUrl ?? null,
      thumbUrl: thumbUrl ?? null,
      printsAvailable: Boolean(printsAvailable),
      featured: Boolean(featured),
      showInGallery: showInGallery ?? true,
      description: description ?? null,
    },
  });

  res.status(201).json(work);
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  const {
    title, slug, status, subject, mediaType, tags, year, dimensions, medium, price,
    originalWidth, originalHeight, imageUrl, fullResUrl, thumbUrl,
    printsAvailable, featured, showInGallery, description,
  } = req.body;

  try {
    const existing = await prisma.work.findFirst({
      where: { id: String(req.params.id), galleryId: req.gallery!.id },
    });
    if (!existing) return res.status(404).json({ error: 'Work not found' });

    const resolvedStatus = normalizeStatus(status);
    const isInProgress = resolvedStatus === 'IN_PROGRESS';

    if (!isInProgress && (!title || !imageUrl)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const work = await prisma.work.update({
      where: { id: existing.id },
      data: {
        title: title || null,
        slug: slug ? String(slug) : existing.slug,
        status: resolvedStatus,
        subject: subject || null,
        mediaType: mediaType ?? null,
        tags: Array.isArray(tags) ? tags : [],
        year: year ? Number(year) : null,
        dimensions: dimensions ?? null,
        medium: medium ?? null,
        price: price !== undefined && price !== null ? Number(price) : null,
        originalWidth: originalWidth ? Number(originalWidth) : null,
        originalHeight: originalHeight ? Number(originalHeight) : null,
        imageUrl: imageUrl ?? null,
        fullResUrl: fullResUrl ?? null,
        thumbUrl: thumbUrl ?? null,
        printsAvailable: Boolean(printsAvailable),
        featured: Boolean(featured),
        showInGallery: showInGallery ?? existing.showInGallery,
        description: description ?? null,
      },
    });
    res.json(work);
  } catch {
    res.status(404).json({ error: 'Work not found' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const work = await prisma.work.findFirst({
      where: { id: String(req.params.id), galleryId: req.gallery!.id },
    });
    if (!work) return res.status(404).json({ error: 'Work not found' });

    // Progress photos are one-off (never reused across works) — delete outright so they
    // don't become permanently orphaned in the library. Reference-photo linkages are cleared
    // too, but the underlying DigitalAsset rows are left alone since they may be linked to
    // other works.
    const progressAssets = await prisma.digitalAsset.findMany({
      where: { linkages: { some: { workId: work.id, role: 'progress' } } },
    });

    await prisma.$transaction([
      prisma.assetLinkage.deleteMany({ where: { workId: work.id } }),
      prisma.digitalAsset.deleteMany({ where: { id: { in: progressAssets.map((a) => a.id) } } }),
      prisma.work.delete({ where: { id: work.id } }),
    ]);

    await deleteObjects([
      work.imageUrl, work.thumbUrl, work.fullResUrl,
      ...progressAssets.flatMap((a) => [a.imageUrl, a.thumbUrl]),
    ]);

    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Work not found' });
  }
});

export default router;
