import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { deleteObjects } from '../lib/r2';

const router = Router();
const SINGLETON_ID = 'singleton';

const defaults = {
  siteTitle: '',
  taglinePrimary: '',
  taglineSecondary: '',
  commissionsEnabled: true,
  commissionTitle: '',
  commissionBody: [] as string[],
  featuredEnabled: true,
  featuredCount: 6,
  newsletterEnabled: true,
  eventsEnabled: true,
  showPrice: true,
};

router.get('/', async (_req, res) => {
  const [config, socialLinks] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.socialLink.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] }),
  ]);
  res.json({ ...(config ?? { id: SINGLETON_ID, ...defaults }), socialLinks });
});

router.patch('/', requireAdmin, async (req, res) => {
  const { siteTitle, taglinePrimary, taglineSecondary, taglineFooter, heroImageUrl, heroThumbUrl, heroFullResUrl, commissionsEnabled, commissionTitle, commissionBody, featuredEnabled, featuredCount, newsletterEnabled, eventsEnabled, showPrice } = req.body;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  if (siteTitle !== undefined) data.siteTitle = String(siteTitle);
  if (taglinePrimary !== undefined) data.taglinePrimary = String(taglinePrimary);
  if (taglineSecondary !== undefined) data.taglineSecondary = String(taglineSecondary);
  if (taglineFooter !== undefined) data.taglineFooter = taglineFooter ? String(taglineFooter) : null;
  if (heroImageUrl !== undefined || heroThumbUrl !== undefined || heroFullResUrl !== undefined) {
    const old = await prisma.siteConfig.findUnique({ where: { id: SINGLETON_ID } });
    if (old?.heroImageUrl && heroImageUrl !== old.heroImageUrl) {
      await deleteObjects([old.heroImageUrl, old.heroThumbUrl, old.heroFullResUrl]);
    }
    data.heroImageUrl = heroImageUrl ? String(heroImageUrl) : null;
    data.heroThumbUrl = heroThumbUrl ? String(heroThumbUrl) : null;
    data.heroFullResUrl = heroFullResUrl ? String(heroFullResUrl) : null;
  }
  if (commissionsEnabled !== undefined) data.commissionsEnabled = Boolean(commissionsEnabled);
  if (commissionTitle !== undefined) data.commissionTitle = String(commissionTitle);
  if (commissionBody !== undefined) data.commissionBody = Array.isArray(commissionBody) ? commissionBody.map(String) : [];
  if (featuredEnabled !== undefined) data.featuredEnabled = Boolean(featuredEnabled);
  if (featuredCount !== undefined) data.featuredCount = Number(featuredCount);
  if (newsletterEnabled !== undefined) data.newsletterEnabled = Boolean(newsletterEnabled);
  if (eventsEnabled !== undefined) data.eventsEnabled = Boolean(eventsEnabled);
  if (showPrice !== undefined) data.showPrice = Boolean(showPrice);

  const config = await prisma.siteConfig.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...defaults, ...data },
  });
  res.json(config);
});

export default router;
