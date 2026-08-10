import { prisma } from '../prisma';
import type { SiteConfig, Work, DigitalAsset } from '@prisma/client';

// Shared by the public API route (client fetch) and the Home page SSR renderer — both need
// "which in-progress work should the landing page currently feature, and its progress photos."
export async function getFeaturedInProgress(
  galleryId: string,
  config: Pick<SiteConfig, 'worksInProgressEnabled'>,
): Promise<{ work: Work; photos: DigitalAsset[] } | null> {
  if (!config.worksInProgressEnabled) return null;

  const works = await prisma.work.findMany({
    where: { galleryId, status: 'IN_PROGRESS', showInGallery: true },
  });
  if (works.length === 0) return null;

  // "Most recently active" — a work's own row rarely changes once created, so the real
  // signal that a piece is currently being worked on is when its latest progress photo
  // landed, not Work.updatedAt (which only reflects edits to the work record itself).
  const latestPhotos = await prisma.assetLinkage.groupBy({
    by: ['workId'],
    where: { galleryId, role: 'progress', workId: { in: works.map((w) => w.id) } },
    _max: { createdAt: true },
  });
  const latestByWork = new Map(latestPhotos.map((l) => [l.workId, l._max.createdAt]));

  const [work] = works.sort((a, b) => {
    const aTime = latestByWork.get(a.id) ?? a.updatedAt;
    const bTime = latestByWork.get(b.id) ?? b.updatedAt;
    return bTime.getTime() - aTime.getTime();
  });

  const linkages = await prisma.assetLinkage.findMany({
    where: { galleryId, workId: work.id, role: 'progress' },
    orderBy: { position: 'asc' },
    include: { asset: true },
  });

  return { work, photos: linkages.map((l) => l.asset) };
}
