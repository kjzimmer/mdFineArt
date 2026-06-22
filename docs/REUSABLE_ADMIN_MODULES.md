# Reusable Admin Modules

Three admin features built for this project are designed to drop into any similar site:
**People CRM**, **Contact/Inquiries Inbox**, and **Analytics**. This guide documents
each module in site-agnostic terms so you can replicate them without starting from scratch.

All three share the same foundation:
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT bearer token checked by `requireAdmin` middleware
- **Frontend**: React + TypeScript, Tailwind CSS, `apiFetch` wrapper

---

## 1. People CRM

### What it does

Maintains a unified contact record (Person) for every human who interacts with the site —
newsletter subscribers, contact form senders, commission/inquiry requesters. Records are
created automatically when forms are submitted (upsert on email), so no manual data entry
is needed. The admin UI shows a list with activity counts and a detail view with full history.

### Data model

```prisma
model Person {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  notes     String?
  tags      String[] @default([])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations — add whichever apply to your site:
  contacts    ContactMessage[]
  newsletter  NewsletterSubscriber?
  orders      Order[]
  // Add commissions, registrations, etc. as needed
}

model NewsletterSubscriber {
  id           String   @id @default(cuid())
  personId     String   @unique
  person       Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  active       Boolean  @default(true)
  source       String?
  subscribedAt DateTime @default(now())
}
```

The key design decision: **Person is the hub, everything else is a spoke.** Each form
submission (contact, newsletter signup, commission request, event registration) does an
upsert on Person by email before creating the child record.

```typescript
// Pattern used in every form-handling route:
const person = await prisma.person.upsert({
  where: { email },
  update: {},                              // don't overwrite existing data
  create: { name, email, phone: phone || null },
});
// then create the child record with personId: person.id
```

### API routes

```
GET  /api/people          [admin] List all people, with _count of related records
GET  /api/people/:id      [admin] Single person with full relation history
PATCH /api/people/:id     [admin] Update name, email, phone, notes, tags
DELETE /api/people/:id    [admin] Delete person and cascade relations
```

### Frontend component

`AdminPeople.tsx` — two-panel layout:

- **Left panel**: scrollable list of Person cards showing name, email, activity badges
  (newsletter, message count, commission count). Narrows when a detail panel is open.
- **Right panel**: detail view with edit form, newsletter toggle, action buttons
  (Invoice, Delete), and chronological history of all child records (messages, commissions, etc.)
- **Copy emails button**: copies all active newsletter subscriber emails to clipboard
  — useful until a proper broadcast tool is in place.

### Customizing per site

1. Update the `personInclude` object in `people.ts` to include the relations your site has.
2. In the frontend, add/remove history sections (contact messages, commissions, registrations, etc.)
   to match your schema.
3. The "Invoice" action button in the detail panel is optional — only wire it up if the site
   has an orders/invoicing tab. Pass `onCreateInvoice` as an optional prop and conditionally render.
4. Tags (`String[]`) are free-form — use them for whatever segmentation makes sense
   (collector, student, press, VIP, etc.).

---

## 2. Contact / Inquiries Inbox

### What it does

A unified inbox that merges all inbound messages from multiple form types into one view,
grouped by category. Unread messages are visually highlighted. Admins can expand messages
inline and mark them read. No separate inbox per form type — everything is in one place.

### Data model

```prisma
model ContactMessage {
  id        String   @id @default(cuid())
  personId  String?
  person    Person?  @relation(fields: [personId], references: [id], onDelete: SetNull)
  name      String
  email     String
  phone     String?
  subject   String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

Duplicate `name`/`email` on the message itself (don't rely solely on the Person relation)
so messages remain readable even if a Person record is later deleted.

For sites with commission/booking/inquiry forms, add those as separate models with their
own status workflows — the inbox component merges them at the frontend level rather than
at the DB level, which keeps the models clean.

### API routes

```
POST  /api/contact           Public — create message, upsert Person, optionally send email notification
GET   /api/contact           [admin] List all messages, newest first
PATCH /api/contact/:id/read  [admin] Mark a message read
```

Email notification on submission is fire-and-forget (do not `await` it — never let email
failure block the user's form submit response). Use Resend, SendGrid, or Formspree:

```typescript
// Fire-and-forget email pattern:
if (process.env.NOTIFICATION_EMAIL_ENDPOINT) {
  fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) })
    .catch((err) => console.error('[email] notification failed:', err));
}
res.status(201).json({ success: true });  // respond immediately
```

### Frontend component

`AdminContact.tsx` — single-column inbox:

- Fetches from all relevant API endpoints in parallel (`Promise.all`)
- Normalizes all message types into a common `Item` shape
- Groups into categories using a `classify(subject)` function — adapt the category
  names and classification logic to your site's form types
- Renders groups in a fixed priority order (most actionable first)
- Unread badge count in the page header
- Expand/collapse message body inline — no separate detail page needed

```typescript
// Normalize all message types into one shape:
interface Item {
  id: string;
  kind: 'contact' | 'commission' | 'booking';  // extend as needed
  group: string;                                 // display category
  name: string;
  email: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  meta?: string;  // secondary info line (e.g. "Size: 24x36 · Budget: $2,000")
}
```

### Customizing per site

1. Update `Promise.all` to fetch from whatever form endpoints your site has.
2. Update the `classify(subject)` function to map subject strings to your category names.
3. Update `groupOrder` and `groupLabels` to match your categories.
4. The `meta` field is a formatted string of structured fields (size, budget, deadline, status)
   — build it per message type in the normalization step.
5. "Mark read" only applies to `ContactMessage` records. Commission/booking status changes
   happen in their own dedicated admin section — the inbox is read-only for those.

---

## 3. Analytics (Cloudflare)

### What it does

Pulls traffic data from Cloudflare's GraphQL Analytics API and renders it in the admin
dashboard. No third-party analytics service, no cookies, no tracking scripts required for
basic visitor counts. Richer data (top pages, referrers, device types) requires adding
Cloudflare's free Web Analytics beacon to the site's `<head>`.

### Prerequisites

The site's domain must be proxied through Cloudflare (orange cloud in DNS settings).
This is required for Zone Analytics — the core visitor count data. Web Analytics (RUM)
can work on any domain, even without Cloudflare proxying, but requires a JS beacon.

### Environment variables (server)

```env
CF_ANALYTICS_TOKEN=    # API token — Cloudflare → My Profile → API Tokens
                       # Use "Read analytics for a zone" template
                       # Scope to the specific zone (domain) only
CF_ZONE_ID=            # Cloudflare dashboard → domain overview → right sidebar
CF_ACCOUNT_ID=         # Same location as Zone ID
CF_WEB_ANALYTICS_SITE_TAG=   # Optional — enables top pages / referrers / device data
```

Create one token per domain. Scoping to a specific zone means a leaked token for one
site cannot read analytics from another.

### API route

`server/src/routes/analytics.ts` — `GET /api/analytics?range=30`

- Protected by `requireAdmin`
- Accepts `range` param: 7, 14, or 30 (days)
- Queries Cloudflare GraphQL `httpRequests1dGroups` for daily aggregates
- Aggregates country data across all days, sorted by share
- 15-minute in-memory cache — avoids hammering Cloudflare API on every tab open
- Returns `source: 'cloudflare'` so the frontend can distinguish live vs. fallback data

```typescript
// Cloudflare GraphQL query (Zone Analytics):
const query = `
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
          sum { requests pageViews bytes countryMap { clientCountryName requests } }
        }
      }
    }
  }
`;
```

Note: `$zoneTag: String!` must be capital-S String — lowercase `string` is a GraphQL
type error that Cloudflare will reject silently.

### Web Analytics beacon (optional)

Add once to `index.html` to unlock top pages, referrers, and device type data:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "YOUR_SITE_TAG"}'></script>
```

Generate the site tag: Cloudflare Dashboard → Web Analytics → Add a site.
The RUM dataset is `rumPageloadEventsAdaptiveGroups` — a separate GraphQL query
from Zone Analytics.

### Frontend component

`AdminAnalytics.tsx` — requires `recharts` (`npm install recharts`):

- Range selector: 7d / 14d / 30d pill buttons, each triggers a fresh API fetch
- **Stat cards**: Unique Visitors, Page Views, Total Requests
- **Line chart**: Unique Visitors + Page Views over time (`LineChart` from Recharts)
- **Country breakdown**: horizontal progress bars, top 5 + Other
- **Device type bar chart**: mock data until RUM beacon is active — labeled accordingly
- **Top Pages / Top Referrers tables**: mock data until RUM beacon — labeled accordingly
- Falls back to mock data automatically if the API call fails, so the tab never breaks

### Data retention beyond 30 days

Cloudflare keeps 30 days on all paid plans. To build longer-term trend data, add a
`DailyAnalytics` table to your schema and have the backend write each day's aggregate
after fetching it:

```prisma
model DailyAnalytics {
  id             String   @id @default(cuid())
  date           DateTime @unique
  uniqueVisitors Int
  pageViews      Int
  requests       Int
  bandwidthBytes BigInt
  createdAt      DateTime @default(now())
}
```

Write the aggregate in the route after a successful Cloudflare fetch (upsert on date).
Then for date ranges beyond 30 days, fall back to your local DB instead of Cloudflare.

### Customizing per site

1. Copy `analytics.ts` to the new site's server, update the route mount in `index.ts`.
2. Add the four env vars to Railway (or whatever host).
3. Copy `AdminAnalytics.tsx` to the new site's frontend. The chart and stat cards are
   completely generic — no site-specific references.
4. Add the Analytics tab to the site's `AdminLayout` tabs array and wire it in `Admin.tsx`.
5. The mock data constants at the top of the frontend file are only shown on error/fallback —
   update them to plausible numbers for the new site if desired.

---

## Shared Infrastructure

These three modules all depend on the same foundations. If you're starting a new site,
set these up first.

### Auth middleware

```typescript
// server/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### apiFetch (frontend)

The frontend uses a thin `apiFetch` wrapper that attaches the JWT from localStorage and
sets `Content-Type: application/json` when the body is a string. All admin API calls go
through this — no raw `fetch` calls in components.

### Admin layout shell

The tab-based admin layout (`AdminLayout.tsx`) is a standalone component that takes
`activeTab`, `onTabChange`, and `children`. Adding a new module is two steps:
1. Add an entry to the `tabs` array in `AdminLayout.tsx`
2. Add a conditional render in `Admin.tsx`

No routing changes needed — the admin panel is a single-page tab switcher, not a
router-based multi-page app.
