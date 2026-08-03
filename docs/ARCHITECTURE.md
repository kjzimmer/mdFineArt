# Architecture — myGalleryWorks.com Platform

*Rewritten 2026-08-03 — the previous version predated the multi-tenant scaffold entirely.
This file describes the multi-tenant SaaS platform as it exists today; CLAUDE.md's Current
State is still the first place to check for what's live, this file is the stable reference for
how it's built.*

---

## Repository Structure

```
mdFineArt/
├── client/                         # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── admin/              # SlideshowEditor, SocialLinksEditor, StructuredListEditor, SupportChat
│       │   ├── layout/              # AdminLayout, AppAdminLayout, TopNav, Footer, Layout
│       │   └── gallery/             # GalleryGrid, PaintingCard, Lightbox, InquireModal
│       ├── pages/                  # Public + admin + app-admin pages (colocated)
│       ├── context/
│       │   ├── AuthContext.tsx     # Gallery-admin auth state, silent refresh
│       │   └── SiteConfigContext.tsx  # Loads/exposes the resolved gallery's SiteConfig
│       ├── lib/apiFetch.ts         # apiFetch wrapper, normalizeWorks, getAccessToken
│       ├── config/gallery.ts       # LEGACY — see "Known Gap" below, not per-gallery yet
│       └── types/index.ts
│
├── server/
│   └── src/
│       ├── routes/                 # Thin HTTP handlers — parse, call service, respond
│       ├── services/
│       │   ├── PersonService.ts       # upsertPersonByEmail()
│       │   ├── ContactService.ts      # submitContact(), submitCommission()
│       │   ├── EmailService.ts        # Resend wrapper — all transactional email
│       │   ├── ProvisioningService.ts # Cloudflare zone/DNS/Worker-route provisioning
│       │   └── storyContent.ts        # Server-rendered "story" content for public SSR routes
│       ├── middleware/
│       │   ├── auth.ts             # requireAdmin JWT check (gallery-scoped)
│       │   ├── gallery.ts          # resolveGallery / resolveGalleryFromRequest / requestHostname
│       │   └── rateLimit.ts        # formSubmitLimit, loginLimit
│       ├── lib/
│       │   ├── r2.ts               # Cloudflare R2 upload/delete, image resize+watermark pipeline
│       │   └── html.ts             # escapeHtml
│       ├── scripts/
│       │   ├── seed-admin.ts       # One-time admin user seed
│       │   └── backfill-dimensions.ts
│       └── prisma.ts               # Prisma client singleton
│
├── prisma/                         # Schema source of truth (lives in server/prisma/)
│   ├── schema.prisma
│   └── migrations/                 # Managed by prisma migrate dev/deploy
│
├── cloudflare-worker/
│   └── gallery-router.js           # Single account-level Worker; routes all client custom domains
│
├── docs/
│   ├── ARCHITECTURE.md             # this file
│   ├── SITE_DESIGN.md
│   ├── TECH_STACK.md
│   ├── ROADMAP.md
│   ├── VISITOR_TRACKING_SPEC.md
│   ├── wip/                        # active/recent feature specs
│   └── archive/
│
├── incoming/                       # Drop files here to trigger transition process
├── railway.toml
└── CLAUDE.md
```

**Known dead code:** `server/src/routes/paintings.ts` still exists but is not imported/mounted
in `index.ts` — superseded by `works.ts` during the Works rename, never deleted.

---

## Multi-Tenancy Model

`Gallery` is the top-level tenant. Every gallery-scoped table carries a `galleryId` foreign
key (NOT NULL). A single Railway deployment and single Postgres database serve every gallery.

**Resolving which gallery a request is for** (`server/src/middleware/gallery.ts`):
1. `requestHostname(req)` — reads `X-Gallery-Hostname` header if present (set by the
   Cloudflare Worker for client custom domains — see Domain Routing below), else falls back to
   `req.hostname`; strips a leading `www.`.
2. Look up `Gallery` by `customDomain` or `previewDomain` matching that hostname.
3. Local dev only (`NODE_ENV !== 'production'`): if no match, fall back to
   `Gallery.slug === process.env.GALLERY_SLUG`. This fallback is hard-disabled in production so
   an unmatched hostname always means "no gallery," never a silent fallback to whichever
   gallery happens to be configured.

Two functions share this: `resolveGallery` (Express middleware, mounted on all `/api/*`
routes, 404s on no match) and `resolveGalleryFromRequest` (used directly by the public
SSR routes in `index.ts`, which fall through to the generic SPA shell on no match instead of
erroring).

**Auth is gallery-scoped:** the JWT carries `galleryId` + `isAppAdmin`; `requireAdmin`
validates the JWT's `galleryId` matches the resolved request gallery. A `GalleryMembership`
junction table (not `Person.isAdmin`, which is legacy/unused for auth) is authoritative for who
administers which gallery — one `Person` can belong to multiple galleries.

**App admin** (`isAppAdmin` on `Person`) sits above all galleries — provisions new galleries,
manages membership, views cross-gallery Support Logs.

---

## Domain Routing

Two paths, chosen per gallery:

**Preview domains** — `slug.mygalleryworks.com`. Wildcard `*.mygalleryworks.com` registered
once on Railway; provisioning is a DB write only (`previewDomain` field), no external API
calls. Railway receives the request with the real hostname directly — no Worker involved.

**Client custom domains** — the client transfers nameservers to Cloudflare nameservers
assigned to their zone in the platform's Cloudflare account (`ProvisioningService.ts` creates
the CF zone, imports/syncs existing DNS, adds a proxied CNAME to Railway, adds a Worker route).
After that, `cloudflare-worker/gallery-router.js` (one script, handles every client domain)
intercepts every request at the Cloudflare edge, sets `X-Gallery-Hostname: <original
hostname>`, and proxies to `fallback.mygalleryworks.com` (Railway). Railway therefore sees
`Host: fallback.mygalleryworks.com` for every Worker-routed request — the real domain only
survives in `X-Gallery-Hostname`, which is why `requestHostname()` checks that header first.
**Confirmed live for melodydebenedictis.com** (custom domain, Worker-routed) and a second
gallery on a preview domain — both working end-to-end.

Every place a public-facing URL is constructed (OG tags, JSON-LD, sitemap, robots.txt) must
use `requestHostname()`/`canonicalBaseUrl()`, never the raw `Host` header or a stored DB field
directly — see `storyContent.ts`. Using a stored field instead of the resolved hostname was
tried and reverted same-day (2026-08-02) because it broke preview-domain identity once a
gallery had both `customDomain` and `previewDomain` set.

---

## Database Schema

Schema source of truth: `server/prisma/schema.prisma`. Existing camelCase column names are a
known deviation (predates the snake_case convention) — new fields use snake_case with `@map`.

### Tenancy & Auth
| Model | Purpose |
|---|---|
| `Gallery` | Top-level tenant — domains, Cloudflare zone info, Square OAuth credentials, tax rate |
| `GalleryMembership` | Person ↔ Gallery join, `isAdmin` flag — authoritative for admin auth |
| `Person` | Cross-gallery CRM hub — every public form submission upserts here by email; `isAppAdmin` for platform-level access |
| `RefreshToken` | 7-day sessions, bcrypt-hashed, revocable |
| `PasswordResetToken` | SHA-256 hashed, 1hr expiry, single-use |

### Gallery Content
| Model | Purpose |
|---|---|
| `SiteConfig` | One row per gallery — the entire admin Configuration panel (see below) |
| `Work` | Gallery artwork — metadata + R2 image URLs (`imageUrl`/`thumbUrl` optimized, `fullResUrl` raw original) |
| `PrintProduct` | Print SKUs linked to a Work |
| `Spotlight` | Featured-work slots (positioned) |
| `Event` | Title/date/venue/description/link/image, `published` flag |
| `ClassOffering` | Label/heading/description/inquiry-subject, `sortOrder`, `published` |
| `SocialLink` | URL-first entry, platform auto-detected client-side |
| `SlideshowSlide` | DB-backed slideshow images, `context` field ("landing" / "commission") |

### Commerce
| Model | Purpose |
|---|---|
| `Order` / `OrderItem` | Invoice flow — DRAFT → INVOICE_SENT → PAID/CANCELLED |
| (Square fields live on `Gallery`) | Per-gallery OAuth tokens, merchant/location IDs, tax rate |

### Inbound / CRM
| Model | Purpose |
|---|---|
| `ContactMessage` | Inbound contact form submissions |
| `CommissionRequest` | Commission inquiry submissions |
| `NewsletterSubscriber` | Email list, linked to `Person` |

### Analytics & AI Support
| Model | Purpose |
|---|---|
| `DailyAnalytics` | Persisted Cloudflare zone data, one row per gallery per day |
| `SupportMessage` | Admin AI chat history, per gallery |
| `SupportLog` | Captured suggestions/bugs from the admin AI chat, app-admin-visible |

### Person as CRM Hub
```
ContactMessage ──┐
CommissionRequest─┤── personId → Person ← personId── NewsletterSubscriber
Order ───────────┘                    ├── memberships → GalleryMembership
                                       └── sessions → RefreshToken
```
Every inbound form upserts `Person` by email via `PersonService.upsertPersonByEmail()` before
creating the child record — routes must not duplicate this logic.

---

## API Routes

All gallery-scoped routes are mounted under `/api` after the `resolveGallery` middleware
(`server/src/index.ts`). Route files: `auth`, `works`, `contact`, `commissions`, `uploads`,
`newsletter`, `people`, `orders`, `analytics`, `config`, `slides`, `social`, `app-admin`,
`square`, `events`, `classes`, `support`. Public invoice routes (`public-invoices`) and the
Square OAuth callback are mounted *before* `resolveGallery` — resolved from `order.publicToken`
or Square's own state param instead of gallery context.

Full route-by-route detail is in each router file (thin — parse, call service, respond); the
shape follows the same pattern throughout: public GET for published/available content, admin
CRUD behind `requireAdmin`.

---

## Auth Flow

```
Login:
  POST /api/auth/login
    → bcrypt.compare(password, person.passwordHash)
    → resolve gallery + GalleryMembership → JWT { galleryId, isAppAdmin, ... } (15 min, in-memory on client)
    → random refresh token (7 days, bcrypt-hashed in DB, HttpOnly cookie)

Authenticated request:
  apiFetch() injects Authorization: Bearer <access_token>
  requireAdmin middleware verifies JWT and that JWT.galleryId === req.gallery.id

Silent refresh (on 401, and proactively every 13 min):
  apiFetch() catches 401 → POST /api/auth/refresh → new access token → retries original request

Logout:
  POST /api/auth/logout → marks RefreshToken.revokedAt, clears cookie
```

App admin auth follows the same JWT/refresh shape with `isAppAdmin: true`; `app-admin.ts`
routes check that flag instead of a `galleryId` match.

---

## Image Upload Flow (`server/src/lib/r2.ts`)

```
uploadWork(file, filename, mimetype, watermarkText):
  1. sharp reads dimensions from the source
  2. Resize → 2400px WebP, watermarked → imageUrl (lightbox/large display)
  3. Resize → 800px WebP, watermarked → thumbUrl (grid/admin thumbnails)
  4. Original bytes, unmodified, unwatermarked → fullResUrl (archival + print production)
  5. All three uploaded to R2 in parallel; nothing lands in R2 if Sharp validation fails first
```
Watermark text is the gallery's `siteTitle`, read at upload time (baked into the image, not
re-appliable later). **R2 originals are immutable** — never modified after upload; DB is the
metadata source of truth.

---

## Server-Rendered Public Content (SSR for discoverability)

The app is a Vite SPA — normally an empty `<div id="root">` plus a JS bundle. Crawlers that
don't execute JavaScript (most AI answer engines, traditional search to a lesser extent) would
otherwise see nothing. `server/src/services/storyContent.ts` server-renders real content
(bio, work descriptions, event/class listings, commission pitch) into the initial HTML for
**every** request on `/`, `/gallery`, `/gallery/:slug`, `/about`, `/commission`, `/events`,
`/classes` — not gated on bot detection. `ReactDOM.createRoot` fully replaces `#root`'s
children on mount, so real users never see the injected content; it's a pure discoverability
layer, not an alternate rendering path they'd notice.

This is a **second, independent implementation** of "what does this page show" — not derived
from the React components. If `About.tsx`/`Commission.tsx`/`Events.tsx`/`Classes.tsx`/
`Gallery.tsx`/`Home.tsx` change what they display, `storyContent.ts` needs a matching update or
the two drift apart. Also generates `/sitemap.xml` and `/robots.txt` per gallery, and JSON-LD
structured data (`ArtGallery`, `VisualArtwork`, `Person`).

Full design rationale: `docs/wip/gallery-discoverability.md`.

---

## Key Architectural Decisions

- **No raw SQL** — all DB access through Prisma
- **No `any` types** without an explicit comment explaining why
- **Tailwind + CSS custom properties** — no separate CSS files; visual identity is entirely
  `--color-*`/`--font-*`/`--radius-*` tokens swapped per gallery via `[data-theme]` — see
  `docs/SITE_DESIGN.md`
- **`normalizeWorks()`** in `apiFetch.ts` is the strict mapping from API response to frontend
  `Work` type — any new field must be added here or it's silently dropped
- **`apiFetch`** handles auth injection, silent refresh, 401 handling — never raw `fetch` in
  components (exception: `AdminPaintings.tsx` uses XHR directly for upload progress tracking,
  via `getAccessToken()`)
- **R2 originals are immutable**
- **Person-as-hub** — `upsertPersonByEmail()` is the single entry point for all public form
  submissions
- **`prisma migrate dev`** locally, **`prisma migrate deploy`** on Railway (automatic at
  startup). Never `prisma db push`

---

## Known Gap: Not Every Setting Is Per-Gallery Yet

`client/src/config/gallery.ts` (`showSubject`, `printsAutoFromResolution`) is a static
TypeScript constant, **not** a `SiteConfig` field — every gallery currently gets the same
values, unlike the ~40 other settings that did get migrated into per-gallery `SiteConfig`
during the multi-tenant scaffold. Found 2026-08-03 during a documentation audit; not yet
scheduled. See CLAUDE.md Gray Area list.
