import { prisma } from '../prisma';
import type { SiteConfig } from '@prisma/client';

// Only these 7 keys get real runtime enforcement in this pass — the other seeded Feature rows'
// minimumTierId is data-only for now, no code path reads it yet. Each maps a Feature.key to the
// SiteConfig boolean it gates.
export const ENFORCED_FEATURES: Record<string, keyof SiteConfig> = {
  featured_works: 'featuredEnabled',
  works_in_progress: 'worksInProgressEnabled',
  reference_library: 'referenceLibraryEnabled',
  events: 'eventsEnabled',
  classes: 'classesEnabled',
  newsletter: 'newsletterEnabled',
  commissions: 'commissionsEnabled',
};

// Subscription tiers are a handful of rows, walked fresh on every call rather than cached —
// intentional at this scale, not an oversight.
export async function getOrderedTierChain(): Promise<string[]> {
  const tiers = await prisma.subscriptionTier.findMany({ select: { id: true, previousTierId: true } });
  const byPrevious = new Map(tiers.map((t) => [t.previousTierId, t.id]));
  const chain: string[] = [];
  const seen = new Set<string>();
  let cursor = byPrevious.get(null);
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    chain.push(cursor);
    cursor = byPrevious.get(cursor);
  }
  return chain;
}

export function isFeatureAvailable(
  gallerySubscriptionTierId: string | null,
  featureMinimumTierId: string | null,
  chain: string[],
): boolean {
  if (!featureMinimumTierId) return true; // ungated feature — always on
  if (!gallerySubscriptionTierId) return true; // no tier assigned — grandfathered, fully unrestricted

  const galleryIdx = chain.indexOf(gallerySubscriptionTierId);
  const minIdx = chain.indexOf(featureMinimumTierId);
  if (galleryIdx === -1 || minIdx === -1) {
    // Stale/unknown tier id (e.g. a minimumTierId left pointing at a deleted tier) — fail open
    // rather than break the site, but log it since this shouldn't normally happen.
    console.warn('[featureGating] unknown tier id in comparison', { gallerySubscriptionTierId, featureMinimumTierId });
    return true;
  }
  return galleryIdx >= minIdx;
}

// The one function every read site calls. Returns a copy of `config` with the 7 enforced
// booleans overwritten to (raw value AND tier allows it) — the raw SiteConfig row is never
// modified, so a gallery's own preference survives being downgraded and re-upgraded later.
export async function getEffectiveSiteConfig<T extends SiteConfig>(config: T, galleryId: string): Promise<T> {
  const [gallery, features, chain] = await Promise.all([
    prisma.gallery.findUnique({ where: { id: galleryId }, select: { subscriptionTierId: true } }),
    prisma.feature.findMany({
      where: { key: { in: Object.keys(ENFORCED_FEATURES) } },
      select: { key: true, minimumTierId: true },
    }),
    getOrderedTierChain(),
  ]);

  const minTierByKey = new Map(features.map((f) => [f.key, f.minimumTierId]));
  const patched = { ...config };
  for (const [featureKey, configField] of Object.entries(ENFORCED_FEATURES)) {
    const minimumTierId = minTierByKey.get(featureKey) ?? null;
    const available = isFeatureAvailable(gallery?.subscriptionTierId ?? null, minimumTierId, chain);
    (patched as Record<string, unknown>)[configField] = Boolean(config[configField]) && available;
  }
  return patched;
}
