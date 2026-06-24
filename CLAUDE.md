# CLAUDE.md — Melody DeBenedictis Artist Website

> For site design and page layouts see `docs/SITE_DESIGN.md`.
> For tech stack details see `docs/TECH_STACK.md`.
> For reusable admin module patterns see `docs/REUSABLE_ADMIN_MODULES.md`.

---

## Project Overview

Full rebuild of melodydebenedictis.com — a fine art portfolio site for Western oil painter
Melody DeBenedictis. React + TypeScript frontend, Node.js + Express backend, PostgreSQL via
Prisma, Cloudflare R2 for image storage, hosted on Railway.

**GitHub:** https://github.com/kjzimmer/mdFineArt
**Production:** Railway (temp URL until domain cutover to melodydebenedictis.com)

---

## Repository Structure (as-built)

```
mdFineArt/
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── TopNav.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── gallery/
│   │   │   │   ├── GalleryGrid.tsx
│   │   │   │   ├── PaintingCard.tsx
│   │   │   │   ├── Lightbox.tsx
│   │   │   │   └── InquireModal.tsx
│   │   │   └── HeroSlideshow.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Commission.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Music.tsx
│   │   │   ├── Classes.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── Admin.tsx            # tab switcher shell
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminPaintings.tsx
│   │   │   ├── AdminCommissions.tsx
│   │   │   ├── AdminContact.tsx     # unified inbox
│   │   │   ├── AdminPeople.tsx      # CRM
│   │   │   ├── AdminOrders.tsx
│   │   │   └── AdminAnalytics.tsx   # Cloudflare analytics
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   └── api.ts               # apiFetch wrapper + normalizePainting
│   │   ├── config/
│   │   │   └── gallery.ts           # showSubject flag etc.
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   └── public/                      # static assets
│       ├── melLanding.jpg
│       ├── melInAction.jpg
│       ├── melOnBelle.jpg
│       ├── melSnowCat.jpg
│       ├── studio.jpg
│       └── logos/                   # membership org logos
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── paintings.ts
│   │   │   ├── contact.ts
│   │   │   ├── commissions.ts
│   │   │   ├── newsletter.ts
│   │   │   ├── people.ts
│   │   │   ├── orders.ts
│   │   │   ├── uploads.ts
│   │   │   ├── analytics.ts         # Cloudflare GraphQL proxy
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   └── auth.ts              # requireAdmin JWT check
│   │   ├── lib/
│   │   │   └── r2.ts                # Cloudflare R2 / S3 client
│   │   ├── scripts/
│   │   │   └── backfill-dimensions.ts  # parked on feature/auto-dimensions branch
│   │   ├── prisma.ts                # Prisma client singleton
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma            # source of truth for DB schema
│   │   └── seed.ts
│   └── package.json
│
├── docs/
│   ├── SITE_DESIGN.md
│   ├── TECH_STACK.md
│   ├── REUSABLE_ADMIN_MODULES.md
│   ├── VISITOR_TRACKING_SPEC.md
│   └── archive/
│       └── ADMIN_ANALYTICS.md
│
├── railway.toml                     # explicit build + start commands for Railway
├── package.json                     # root — scripts only, no dependencies
└── CLAUDE.md
```

---

## Database

Schema source of truth: `server/prisma/schema.prisma`

Key models: `Painting`, `Person`, `ContactMessage`, `CommissionRequest`,
`NewsletterSubscriber`, `Order`, `OrderItem`, `PrintProduct`, `Spotlight`

**The Person model is the CRM hub.** Every form submission (contact, newsletter,
commission) does an upsert on Person by email before creating the child record.
This auto-populates the People admin tab with no manual data entry.

**DB workflow:** `prisma db push` (not `prisma migrate dev`) — schema changes are
pushed directly to the Railway Postgres instance. No migration files.

---

## API Routes (as-built)

```
# Paintings
GET    /api/paintings               list (filters: subject, status, featured, search)
GET    /api/paintings/:id           single painting by id or slug
POST   /api/paintings               [admin] create
PUT    /api/paintings/:id           [admin] update
DELETE /api/paintings/:id           [admin] delete
GET    /api/paintings/:id/download  [admin] download full-res image

# Uploads
POST   /api/uploads/bulk            [admin] bulk upload images → R2, creates Painting records

# Commissions
POST   /api/commissions             public — submit request
GET    /api/commissions             [admin] list
GET    /api/commissions/:id         [admin] detail
PATCH  /api/commissions/:id         [admin] update status / notes

# Contact
POST   /api/contact                 public — submit message, upsert Person
GET    /api/contact                 [admin] list
PATCH  /api/contact/:id/read        [admin] mark read

# People
GET    /api/people                  [admin] list with activity counts
GET    /api/people/:id              [admin] detail with full history
PATCH  /api/people/:id              [admin] update name/email/phone/notes/tags
DELETE /api/people/:id              [admin] delete + cascade

# Newsletter
POST   /api/newsletter/subscribe    public — subscribe, upsert Person
POST   /api/newsletter/unsubscribe  public — unsubscribe by email
GET    /api/newsletter/subscribers  [admin] list
PATCH  /api/newsletter/subscribers/:id  [admin] toggle active

# Orders
GET    /api/orders                  [admin] list
GET    /api/orders/:id              [admin] detail
POST   /api/orders                  [admin] create invoice
PATCH  /api/orders/:id              [admin] update status

# Analytics
GET    /api/analytics?range=30      [admin] Cloudflare traffic data, cached 15 min

# Auth
POST   /api/auth/login              admin login → JWT (7d expiry)
```

---

## Environment Variables

```bash
# server — set in Railway Variables
DATABASE_URL=postgresql://...
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=                    # plain text — no bcrypt yet; replace with DB auth later
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
FORMSPREE_CONTACT_ENDPOINT=        # optional — contact form email notifications
CF_ANALYTICS_TOKEN=                # Cloudflare API token, Analytics:Read, scoped to zone
CF_ZONE_ID=
CF_ACCOUNT_ID=
CF_WEB_ANALYTICS_SITE_TAG=         # optional — enables RUM data (top pages, referrers)

# client — set in client/.env (dev only; production reads from same origin)
VITE_API_URL=http://localhost:3001
```

---

## Dev Setup

```bash
# Install
npm install                        # root
cd client && npm install
cd ../server && npm install

# Run (two terminals)
cd client && npm run dev           # → http://localhost:5173
cd server && npm run dev           # → http://localhost:3001

# DB schema changes
cd server && npx prisma db push    # push schema changes to Railway Postgres
npx prisma studio                  # browse data
```

---

## Key Architectural Decisions

- **No raw SQL** — all DB access through Prisma
- **No `any` types** — strict TypeScript throughout
- **Tailwind only** — no separate CSS files
- **`normalizePainting()`** in `api.ts` is the strict mapping from API response to
  frontend `Painting` type. Any new painting field must be added here or it will be
  silently dropped.
- **`apiFetch`** in `api.ts` handles auth header injection and 401 → redirect to login.
  All API calls go through this — never raw `fetch` in components.
- **Images**: originals uploaded to R2 are never modified after upload — R2 is the
  master archive. DB is the metadata source of truth.
- **Admin auth**: credentials in env vars (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
  JWT expiry is 7 days. Planned: move to DB-backed user model.
- **`prisma db push`** not `prisma migrate dev` — no migration file history.

---

## Coding Conventions

- Components: PascalCase, filename matches component name
- Pages in `client/src/pages/`, shared components in `client/src/components/`
- Admin pages colocated with public pages in `pages/` (not a subdirectory)
- Server input validation: zod (planned) — currently basic manual checks
- Env vars accessed via `process.env` directly on server (no typed config.ts yet)
- Images: `loading="lazy"` on gallery images

---

## Branch Notes

- `main` — production, auto-deploys to Railway on push
- `feature/auto-dimensions` — local only, parked; auto-DPI detection from image metadata
  (accuracy was insufficient; preserved for future revisit)
