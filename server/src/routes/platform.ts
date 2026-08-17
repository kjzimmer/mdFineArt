import { Router } from 'express';
import { prisma } from '../prisma';
import { getOrderedTierChain } from '../lib/featureGating';

const router = Router();

// GET /api/platform/features — public, unauthenticated, no gallery context (platform-global
// data, not tied to any gallery/hostname). For the separate mygalleryworks.com marketing site
// to stay in sync with the real feature list and subscription tiers, instead of a hand-maintained
// duplicate. Shipped features only — roadmap-status features are internal planning, not
// customer-facing yet.
router.get('/features', async (_req, res) => {
  const [features, tiers, chain] = await Promise.all([
    prisma.feature.findMany({
      where: { status: 'shipped' },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: {
        key: true,
        name: true,
        customerDescription: true,
        category: true,
        minimumTierId: true,
      },
    }),
    prisma.subscriptionTier.findMany({ select: { id: true, name: true, description: true } }),
    getOrderedTierChain(),
  ]);

  const tierById = new Map(tiers.map((t) => [t.id, t]));
  res.json({
    features,
    tiers: chain.map((id) => tierById.get(id)).filter(Boolean),
  });
});

export default router;
