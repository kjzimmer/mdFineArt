import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import type { Gallery } from '@prisma/client';

declare global {
  namespace Express {
    interface Request { gallery?: Gallery; }
  }
}

// X-Gallery-Hostname is set by the Cloudflare gallery-router Worker for client
// custom domains, bypassing Cloudflare's proxy which overwrites X-Forwarded-Host. This is the
// single source of truth for "what domain is this request actually for" — used both to look
// up which gallery a request belongs to, and (via canonicalBaseUrl in storyContent.ts) to
// build every public-facing URL (og:url, JSON-LD, sitemap, robots). Keeping both on this one
// function guarantees they can never disagree — e.g. a request on the preview domain reports
// the preview domain everywhere, a request on a custom domain reports that custom domain,
// regardless of which one the gallery record considers "primary."
export function requestHostname(req: Request): string {
  const raw = (req.headers['x-gallery-hostname'] as string) || req.hostname;
  return raw.replace(/^www\./, '');
}

export async function resolveGalleryFromRequest(req: Request): Promise<Gallery | null> {
  const hostname = requestHostname(req);

  const gallery = await prisma.gallery.findFirst({
    where: {
      OR: [{ customDomain: hostname }, { previewDomain: hostname }],
    },
  });
  if (gallery) return gallery;

  // Local dev only: GALLERY_SLUG bypasses hostname lookup since localhost never matches a
  // real customDomain/previewDomain. Must never apply in production — an unmatched hostname
  // (unconfigured domain, typo, stray request) should resolve to "no gallery," never silently
  // fall back to whichever gallery happens to be configured. Gated on NODE_ENV rather than
  // just "don't set GALLERY_SLUG in Railway" so a leftover/misconfigured env var can't cause
  // cross-tenant content (sitemap, SSR pages, API responses) to leak onto the wrong domain.
  if (process.env.NODE_ENV !== 'production' && process.env.GALLERY_SLUG) {
    return prisma.gallery.findUnique({ where: { slug: process.env.GALLERY_SLUG } });
  }
  return null;
}

export async function resolveGallery(req: Request, res: Response, next: NextFunction): Promise<void> {
  const gallery = await resolveGalleryFromRequest(req);

  if (!gallery || !gallery.active) {
    res.status(404).json({ error: 'Gallery not found' });
    return;
  }

  req.gallery = gallery;
  next();
}
