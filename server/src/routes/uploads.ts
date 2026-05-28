import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { uploadPainting } from '../lib/r2';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 },
});

router.post('/bulk', requireAdmin, upload.array('files', 20), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files provided' });

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: { filename: string; error: string }[] = [];

  for (const file of files) {
    try {
      const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
      const title = nameWithoutExt.replace(/[-_]+/g, ' ').trim();

      const existing = await prisma.painting.findFirst({ where: { title } });
      if (existing) {
        skipped.push(file.originalname);
        continue;
      }

      const urls = await uploadPainting(file.buffer, file.originalname, file.mimetype);

      const slug =
        nameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
        '-' +
        Date.now().toString(36);

      await prisma.painting.create({
        data: {
          title,
          slug,
          subject: 'Landscape',
          status: 'AVAILABLE',
          imageUrl: urls.imageUrl,
          thumbUrl: urls.thumbUrl,
          fullResUrl: urls.fullResUrl,
        },
      });

      created.push(file.originalname);
    } catch (err) {
      errors.push({ filename: file.originalname, error: String(err) });
    }
  }

  res.json({ created: created.length, skipped, errors });
});

export default router;
