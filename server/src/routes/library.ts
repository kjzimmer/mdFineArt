import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { uploadLibraryAsset, deleteObjects } from '../lib/r2';

const router = Router();
router.use(requireAdmin);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, _file, cb) => cb(null, `mdfine-library-${Date.now()}-${Math.random().toString(36).slice(2)}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

function handleMulterError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `${err.message} (limit: 500 MB per file)` });
  }
  next(err);
}

router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', 40)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files provided' });

  const galleryId = req.gallery!.id;
  const { workId, role } = req.body as { workId?: string; role?: string };

  let nextPosition = 0;
  if (workId && role === 'progress') {
    const last = await prisma.assetLinkage.findFirst({
      where: { workId, role: 'progress' },
      orderBy: { position: 'desc' },
    });
    nextPosition = (last?.position ?? -1) + 1;
  }

  const created: { asset: unknown; error?: string }[] = [];
  for (const file of files) {
    try {
      const { imageUrl, thumbUrl, originalWidth, originalHeight } = await uploadLibraryAsset(file.path);
      const asset = await prisma.digitalAsset.create({
        data: { galleryId, imageUrl, thumbUrl, originalWidth, originalHeight },
      });
      if (workId && role) {
        await prisma.assetLinkage.create({
          data: { galleryId, assetId: asset.id, workId, role, position: role === 'progress' ? nextPosition++ : 0 },
        });
      }
      created.push({ asset });
    } catch (err) {
      created.push({ asset: null, error: String(err) });
    } finally {
      fs.unlink(file.path, () => {});
    }
  }

  res.status(201).json({ created });
});

router.get('/', async (req: Request, res: Response) => {
  const { workId, role } = req.query as { workId?: string; role?: string };
  const assets = await prisma.digitalAsset.findMany({
    where: {
      galleryId: req.gallery!.id,
      ...(workId || role ? { linkages: { some: { ...(workId ? { workId: String(workId) } : {}), ...(role ? { role: String(role) } : {}) } } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // When filtered by workId+role, attach that specific linkage's id/position so the caller
  // (e.g. a work editor's photo section) can unlink/reorder without a second round-trip.
  let result: (typeof assets[number] & { linkageId?: string; position?: number })[] = assets;
  if (workId && role) {
    const linkages = await prisma.assetLinkage.findMany({
      where: { galleryId: req.gallery!.id, workId: String(workId), role: String(role) },
      orderBy: { position: 'asc' },
    });
    const byAsset = new Map(linkages.map((l) => [l.assetId, l]));
    result = assets.map((a) => ({ ...a, linkageId: byAsset.get(a.id)?.id, position: byAsset.get(a.id)?.position }));
    if (role === 'progress') result.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  res.json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const asset = await prisma.digitalAsset.findFirst({
    where: { id: String(req.params.id), galleryId: req.gallery!.id },
    include: { linkages: { include: { work: { select: { id: true, title: true, slug: true } } } } },
  });
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  res.json(asset);
});

router.post('/:id/link', async (req: Request, res: Response) => {
  const { workId, role } = req.body as { workId?: string; role?: string };
  if (!workId || !role) return res.status(400).json({ error: 'workId and role are required' });

  const asset = await prisma.digitalAsset.findFirst({
    where: { id: String(req.params.id), galleryId: req.gallery!.id },
  });
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const linkage = await prisma.assetLinkage.upsert({
    where: { assetId_workId_role: { assetId: asset.id, workId, role } },
    create: { galleryId: req.gallery!.id, assetId: asset.id, workId, role },
    update: {},
  });
  res.status(201).json(linkage);
});

router.delete('/:id/link/:linkageId', async (req: Request, res: Response) => {
  const linkage = await prisma.assetLinkage.findFirst({
    where: { id: String(req.params.linkageId), assetId: String(req.params.id), galleryId: req.gallery!.id },
  });
  if (!linkage) return res.status(404).json({ error: 'Linkage not found' });

  await prisma.assetLinkage.delete({ where: { id: linkage.id } });
  res.json({ success: true });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const asset = await prisma.digitalAsset.findFirst({
    where: { id: String(req.params.id), galleryId: req.gallery!.id },
  });
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  await prisma.$transaction([
    prisma.assetLinkage.deleteMany({ where: { assetId: asset.id } }),
    prisma.digitalAsset.delete({ where: { id: asset.id } }),
  ]);
  await deleteObjects([asset.imageUrl, asset.thumbUrl]);

  res.json({ success: true });
});

export default router;
