import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import type { Gallery } from '@prisma/client';

declare global {
  namespace Express {
    interface Request { gallery?: Gallery; }
  }
}

export async function resolveGallery(req: Request, res: Response, next: NextFunction): Promise<void> {
  const hostname = req.hostname; // strips port

  let gallery = await prisma.gallery.findUnique({
    where: { customDomain: hostname },
  });

  if (!gallery && process.env.GALLERY_SLUG) {
    gallery = await prisma.gallery.findUnique({
      where: { slug: process.env.GALLERY_SLUG },
    });
  }

  if (!gallery || !gallery.active) {
    res.status(404).json({ error: 'Gallery not found' });
    return;
  }

  req.gallery = gallery;
  next();
}
