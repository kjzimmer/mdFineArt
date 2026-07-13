import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

interface CacheEntry { data: unknown; expiresAt: number; }
const cache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}
function setCached(key: string, data: unknown, ttlSeconds: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function queryCloudflare(query: string, variables: Record<string, unknown>) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CF_ANALYTICS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Cloudflare API error: ${res.status}`);
  const json = await res.json() as { data?: unknown; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

function dateRange(days: number) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86_400_000);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function aggregateCountries(groups: { sum: { countryMap: { clientCountryName: string; requests: number }[] } }[]) {
  const totals: Record<string, number> = {};
  for (const g of groups) {
    for (const c of g.sum.countryMap ?? []) {
      totals[c.clientCountryName] = (totals[c.clientCountryName] ?? 0) + c.requests;
    }
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5);
  const otherRequests = sorted.slice(5).reduce((s, [, n]) => s + n, 0);
  const grandTotal = sorted.reduce((s, [, n]) => s + n, 0) || 1;
  const result = top.map(([countryName, requests]) => ({
    countryName,
    requests,
    pct: Math.round((requests / grandTotal) * 100),
  }));
  if (otherRequests > 0) result.push({ countryName: 'Other', requests: otherRequests, pct: Math.round((otherRequests / grandTotal) * 100) });
  return result;
}

// GET /api/analytics?range=30
router.get('/', requireAdmin, async (req, res) => {
  const { CF_ZONE_ID, CF_ANALYTICS_TOKEN } = process.env;
  if (!CF_ZONE_ID || !CF_ANALYTICS_TOKEN) {
    return res.status(503).json({ error: 'Cloudflare analytics not configured' });
  }

  const days = Math.min(Math.max(parseInt(req.query.range as string) || 30, 1), 30);
  const cacheKey = `analytics:${days}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { startDate, endDate } = dateRange(days);

    const zoneQuery = `
      query($zoneTag: String!, $startDate: Date!, $endDate: Date!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              limit: 31
              filter: { date_geq: $startDate, date_leq: $endDate }
              orderBy: [date_ASC]
            ) {
              dimensions { date }
              uniq { uniques }
              sum {
                requests
                pageViews
                bytes
                countryMap { clientCountryName requests }
              }
            }
          }
        }
      }
    `;

    const data = await queryCloudflare(zoneQuery, { zoneTag: CF_ZONE_ID, startDate, endDate }) as {
      viewer: { zones: { httpRequests1dGroups: {
        dimensions: { date: string };
        uniq: { uniques: number };
        sum: { requests: number; pageViews: number; bytes: number; countryMap: { clientCountryName: string; requests: number }[] };
      }[] }[] };
    };

    const groups = data.viewer.zones[0]?.httpRequests1dGroups ?? [];

    const result = {
      daily: groups.map((g) => ({
        date: new Date(g.dimensions.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uniqueVisitors: g.uniq.uniques,
        pageViews: g.sum.pageViews,
        requests: g.sum.requests,
        bandwidth: g.sum.bytes,
      })),
      totals: {
        uniqueVisitors: groups.reduce((s, g) => s + g.uniq.uniques, 0),
        pageViews: groups.reduce((s, g) => s + g.sum.pageViews, 0),
        requests: groups.reduce((s, g) => s + g.sum.requests, 0),
      },
      topCountries: aggregateCountries(groups),
      lastUpdated: new Date().toISOString(),
      source: 'cloudflare',
    };

    setCached(cacheKey, result, 900); // 15 minutes

    // Persist daily data in background — accumulates history beyond Cloudflare's free tier window
    Promise.all(
      groups.map((g) =>
        prisma.dailyAnalytics.upsert({
          where: { date: new Date(g.dimensions.date) },
          update: {
            uniqueVisitors: g.uniq.uniques,
            pageViews: g.sum.pageViews,
            requests: g.sum.requests,
            bandwidth: g.sum.bytes,
          },
          create: {
            date: new Date(g.dimensions.date),
            uniqueVisitors: g.uniq.uniques,
            pageViews: g.sum.pageViews,
            requests: g.sum.requests,
            bandwidth: g.sum.bytes,
          },
        })
      )
    ).catch((err) => console.error('[analytics] DB persist error:', err));

    res.json(result);
  } catch (err) {
    console.error('Analytics fetch error:', err);
    res.status(502).json({ error: 'Failed to fetch analytics from Cloudflare' });
  }
});

export default router;
