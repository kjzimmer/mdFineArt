import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { uploadWork, printTier } from '../lib/r2';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const router = Router();

// Disk storage: multer writes to a temp file so the TIFF never lands in the
// Node.js JS heap. Sharp reads directly from the file path (C++ I/O), which
// avoids OOM crashes on large originals.
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, _file, cb) => cb(null, `mdfine-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

function handleMulterError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      created: 0,
      skipped: [],
      errors: [{ filename: 'upload', error: `${err.message} (limit: 500 MB per file)` }],
    });
  }
  next(err);
}

router.post('/image', requireAdmin, (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file provided' });
  try {
    const watermarkText = req.gallery!.name || undefined;
    const result = await uploadWork(file.path, file.originalname, file.mimetype, watermarkText);
    res.json(result);
  } catch (err) {
    const msg = String(err);
    const friendly = msg.includes('tiff2vips') || msg.includes('TIFFReadDirEntry')
      ? 'Layered TIFF — flatten in Photoshop/GIMP before uploading (Image → Flatten Image)'
      : msg;
    res.status(500).json({ error: friendly });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

// Lightweight image upload for event/config images — single WebP, no watermark, no artwork pipeline
router.post('/config-image', requireAdmin, (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file provided' });
  try {
    const id = crypto.randomUUID();
    const webpBuffer = await sharp(file.path)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const key = `config/${id}.webp`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
    }));
    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

router.post('/bulk', requireAdmin, (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files provided' });

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: { filename: string; error: string }[] = [];

  const galleryId = req.gallery!.id;
  const watermarkText = req.gallery!.name || undefined;

  for (const file of files) {
    try {
      const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
      const title = nameWithoutExt.replace(/[-_]+/g, ' ').trim();

      const existing = await prisma.work.findFirst({ where: { galleryId, title } });
      if (existing) {
        skipped.push(file.originalname);
        continue;
      }

      const urls = await uploadWork(file.path, file.originalname, file.mimetype, watermarkText);

      const slug =
        nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
        '-' +
        Date.now().toString(36);

      await prisma.work.create({
        data: {
          galleryId,
          title,
          slug,
          subject: 'Landscape',
          status: 'AVAILABLE',
          imageUrl: urls.imageUrl,
          thumbUrl: urls.thumbUrl,
          fullResUrl: urls.fullResUrl,
          originalWidth: urls.originalWidth,
          originalHeight: urls.originalHeight,
          printsAvailable: printTier(urls.originalWidth, urls.originalHeight) !== 'none',
        },
      });

      created.push(file.originalname);
    } catch (err) {
      const msg = String(err);
      const friendly = msg.includes('tiff2vips') || msg.includes('TIFFReadDirEntry')
        ? 'Layered TIFF — flatten before saving (Image → Flatten Image in Photoshop/GIMP)'
        : msg;
      errors.push({ filename: file.originalname, error: friendly });
    } finally {
      fs.unlink(file.path, () => {});
    }
  }

  res.json({ created: created.length, skipped, errors });
});

export default router;
