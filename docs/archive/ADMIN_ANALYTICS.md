# Admin Analytics Component — Cloudflare Integration

## Cost

**Both analytics systems are free** on Cloudflare's Free plan — no upgrade required.

- **Zone Analytics + GraphQL API** — included on all plans, including Free. Provides 30 days of historical data accessible via the GraphQL API with no additional setup.
- **Cloudflare Web Analytics (RUM)** — free for any Cloudflare account, even for sites not proxied through Cloudflare. Requires adding a JS beacon snippet to the site's HTML `<head>`.
- **GraphQL API access** — available to all plans including Free. Cloudflare has explicitly reaffirmed free-tier access to analytics GraphQL endpoints.

The only cost consideration: if Cloudflare R2 is already in use for image storage (which it is per the project stack), the domain should already be proxied through Cloudflare, meaning Zone Analytics is active with zero extra configuration.

---

## Overview

The admin analytics component fetches visitor and traffic data from Cloudflare's GraphQL Analytics API and renders it in the existing admin dashboard. All API calls are proxied through the Express backend to keep credentials out of the browser.

There are two data sources:

| Source | Dataset | What it provides |
|---|---|---|
| **Zone Analytics** | `httpRequests1dGroups` | Requests, unique visitors (IP-based), page views, bandwidth, country breakdown |
| **Web Analytics (RUM)** | `rumPageloadEventsAdaptiveGroups` | Top pages, referrers, device type, browser, OS — requires JS beacon |

---

## Environment Variables

Add to `.env` and Railway/Render config:

```env
CF_ANALYTICS_TOKEN=        # Cloudflare API token with Analytics:Read permission
CF_ZONE_ID=                # Zone ID from Cloudflare dashboard (domain overview page)
CF_ACCOUNT_ID=             # Account ID from Cloudflare dashboard
CF_WEB_ANALYTICS_SITE_TAG= # Generated when Web Analytics is enabled for the site (optional)
```

To generate `CF_ANALYTICS_TOKEN`: Cloudflare Dashboard → My Profile → API Tokens → Create Token → use the **Read analytics** template, scoped to the specific zone.

---

## Available Data Fields

### Zone Analytics (always available, no JS beacon needed)

Queried from `httpRequests1dGroups` (daily) or `httpRequests1hGroups` (hourly):

| Field | Description |
|---|---|
| `uniq.uniques` | Unique visitor IPs per day |
| `sum.requests` | Total HTTP requests |
| `sum.pageViews` | Successful HTML responses |
| `sum.bytes` | Total bandwidth transferred |
| `sum.countryMap` | Array of `{ clientCountryName, requests }` — visitors by country |
| `sum.responseStatusMap` | Breakdown by HTTP status code |
| `sum.cachedRequests` | Requests served from Cloudflare cache |
| `dimensions.date` | Date for the data point |

> **Note on unique visitor counts:** Cloudflare counts every unique IP, including bots and crawlers. Counts will be higher than JS-based tools like Google Analytics, which only fire when a real browser loads a page. Use these numbers for trend analysis, not absolute audience size.

### Web Analytics / RUM (requires JS beacon in `<head>`)

Queried from `rumPageloadEventsAdaptiveGroups`:

| Field | Description |
|---|---|
| `count` | Total page load events |
| `dimensions.requestPath` | URL path (e.g. `/gallery`, `/shop`) |
| `dimensions.refererHost` | External domain sending traffic (referrers) |
| `dimensions.deviceType` | `desktop`, `mobile`, `tablet` |
| `dimensions.browserFamily` | Chrome, Safari, Firefox, etc. |
| `dimensions.operatingSystemFamily` | Windows, macOS, iOS, Android, etc. |
| `dimensions.countryName` | Visitor country |

Web Analytics is privacy-first: no cookies, no localStorage, no IP fingerprinting.

---

## Backend API Route

**File:** `src/routes/admin/analytics.ts`

```typescript
// GET /api/admin/analytics?range=30d
// Returns aggregated Cloudflare analytics for the admin dashboard
// Cached for 15 minutes to reduce Cloudflare API calls

router.get('/analytics', requireAdmin, async (req, res) => {
  const days = parseInt(req.query.range as string) || 30;
  const cacheKey = `analytics:${days}`;

  // Check cache (simple in-memory or Redis if available)
  const cached = analyticsCache.get(cacheKey);
  if (cached) return res.json(cached);

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const query = `
    query GetZoneAnalytics($zoneTag: string!, $startDate: Date!, $endDate: Date!) {
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
              countryMap {
                clientCountryName
                requests
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CF_ANALYTICS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        zoneTag: process.env.CF_ZONE_ID,
        startDate,
        endDate,
      },
    }),
  });

  const data = await response.json();
  const groups = data.data.viewer.zones[0].httpRequests1dGroups;

  const result = {
    daily: groups.map((g: any) => ({
      date: g.dimensions.date,
      uniqueVisitors: g.uniq.uniques,
      requests: g.sum.requests,
      pageViews: g.sum.pageViews,
      bandwidth: g.sum.bytes,
    })),
    totals: {
      uniqueVisitors: groups.reduce((acc: number, g: any) => acc + g.uniq.uniques, 0),
      requests: groups.reduce((acc: number, g: any) => acc + g.sum.requests, 0),
      pageViews: groups.reduce((acc: number, g: any) => acc + g.sum.pageViews, 0),
    },
    topCountries: aggregateCountries(groups),
    lastUpdated: new Date().toISOString(),
  };

  analyticsCache.set(cacheKey, result, 900); // 15-minute TTL
  res.json(result);
});
```

---

## Frontend Component

**File:** `src/components/admin/AnalyticsDashboard.tsx`

### Widget Layout

```
┌─────────────────────────────────────────────────────┐
│  [30 days ▼]  [Refresh]                             │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Unique   │ │ Page     │ │ Total    │           │
│  │ Visitors │ │ Views    │ │ Requests │           │
│  │  1,284   │ │  4,702   │ │  8,915   │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  Visitors Over Time (line chart)                    │
│  ─────────────────────────────────────────          │
│                                                     │
│  Top Countries              Device Types            │
│  🇺🇸 United States  68%    Desktop  71%            │
│  🇨🇦 Canada          9%    Mobile   24%            │
│  🇬🇧 United Kingdom  6%    Tablet    5%            │
│  🇦🇺 Australia       4%                            │
│  Other             13%                              │
│                                                     │
│  Top Pages (requires Web Analytics beacon)          │
│  /gallery              482 views                    │
│  /shop                 301 views                    │
│  /commission           189 views                    │
│                                                     │
│  Top Referrers (requires Web Analytics beacon)      │
│  instagram.com         142 visits                   │
│  google.com             98 visits                   │
│  direct / none         611 visits                   │
└─────────────────────────────────────────────────────┘
```

### Component Props / State

```typescript
interface AnalyticsData {
  daily: {
    date: string;
    uniqueVisitors: number;
    requests: number;
    pageViews: number;
    bandwidth: number;
  }[];
  totals: {
    uniqueVisitors: number;
    requests: number;
    pageViews: number;
  };
  topCountries: {
    countryName: string;
    requests: number;
    pct: number;
  }[];
  lastUpdated: string;
}
```

### Suggested Chart Libraries

- **Recharts** — already likely in the project for other admin views; handles line charts and bar charts cleanly with Tailwind-compatible styling
- No additional dependencies needed

---

## Web Analytics Beacon Setup

To enable top pages, referrers, and device-type data, add the beacon to `index.html`:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "YOUR_SITE_TAG"}'></script>
```

The site tag is generated in: Cloudflare Dashboard → Web Analytics → Add a site.

This is a one-time setup step; no ongoing maintenance required.

---

## Data Retention by Plan

| Plan | Zone Analytics history | Web Analytics history |
|---|---|---|
| Free | 30 days | 30 days |
| Pro | 30 days | 30 days |
| Business | 30 days | 30 days |
| Enterprise | 90 days | 90 days |

For a fine art portfolio site, 30 days is sufficient for operational monitoring. If longer trend history becomes useful (seasonal patterns, show timing, etc.), consider logging daily aggregates to the PostgreSQL database using a scheduled job.

---

## Implementation Notes

- The analytics route should be protected by the same `requireAdmin` middleware as other admin routes
- Cache responses for 15 minutes minimum; analytics data does not need to be real-time
- If `CF_WEB_ANALYTICS_SITE_TAG` is not set, the component should gracefully degrade — show Zone Analytics data and display a prompt to enable Web Analytics for richer metrics
- Country flags can be rendered from ISO country codes using a simple emoji lookup (`US` → 🇺🇸) — no library needed
- Bandwidth bytes should be formatted as KB/MB/GB for display
