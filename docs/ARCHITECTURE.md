# Architecture — Melody DeBenedictis Artist Website

---

## Repository Structure

```
mdFineArt/
├── client/                         # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── layout/             # AdminLayout, TopNav, Footer, Layout
│       │   ├── gallery/            # GalleryGrid, PaintingCard, Lightbox, InquireModal
│       │   └── HeroSlideshow.tsx
│       ├── pages/                  # Public + admin pages (colocated)
│       ├── context/AuthContext.tsx # Auth state, silent refresh on mount
│       ├── lib/apiFetch.ts         # apiFetch wrapper + normalizePainting + getAccessToken
│       ├── config/gallery.ts       # showSubject flag, printsAutoFromResolution
│       └── types/index.ts
│
├── server/
│   └── src/
│       ├── routes/                 # Thin HTTP handlers — parse, call service, respond
│       ├── services/               # Business logic shared across routes
│       │   ├── PersonService.ts    # upsertPersonByEmail()
│       │   └── ContactService.ts  # submitContact(), submitCommission(), notifyFormspree()
│       ├── middleware/
│       │   ├── auth.ts             # requireAdmin JWT check
│       │   └── rateLimit.ts        # formSubmitLimit, loginLimit
│       ├── lib/r2.ts               # Cloudflare R2 / S3 client
│       ├── scripts/seed-admin.ts   # One-time admin user seed
│       └── prisma.ts               # Prisma client singleton
│
├── prisma/                         # Schema source of truth (lives in server/prisma/)
│   ├── schema.prisma
│   └── migrations/                 # Managed by prisma migrate dev/deploy
│
├── docs/
│   ├── ARCHITECTURE.md             # this file
│   ├── SITE_DESIGN.md
│   ├── TECH_STACK.md
│   ├── VISITOR_TRACKING_SPEC.md
│   ├── wip/                        # active feature specs
│   └── archive/
│
├── incoming/                       # Drop files here to trigger transition process
├── railway.toml
└── CLAUDE.md
```

---

## Database Schema

Schema source of truth: `server/prisma/schema.prisma`

### Core Models

| Model | Purpose |
|-------|---------|
| `Person` | CRM hub — every public form submission upserts here by email |
| `Painting` | Gallery artwork — metadata + R2 image URLs |
| `ContactMessage` | Inbound contact form submissions |
| `CommissionRequest` | Commission inquiry submissions |
| `NewsletterSubscriber` | Email list, linked to Person |
| `Order` / `OrderItem` | Admin-created invoices |
| `PrintProduct` | Print SKUs linked to a Painting |
| `Spotlight` | Featured painting slots (positioned) |
| `RefreshToken` | Active sessions — bcrypt-hashed, 7-day expiry, revocable |
| `DailyAnalytics` | Persisted Cloudflare zone data (one row per day) |

### Person as CRM Hub

```
ContactMessage ──┐
CommissionRequest─┤── personId → Person ← personId── NewsletterSubscriber
Order ───────────┘                    └── sessions → RefreshToken
```

Every inbound form upserts `Person` by email via `PersonService.upsertPersonByEmail()`
before creating the child record. The People admin tab is automatically populated with
no manual data entry.

### Key Schema Conventions

- Existing camelCase column names are a known deviation — left in place to avoid data loss migration
- New fields use snake_case with `@map("snake_case")`
- New models use `@@map("snake_case")` for the table name

---

## API Routes

```
# Public
POST   /api/contact                  submit message — upserts Person, notifies Formspree
POST   /api/commissions              submit request — upserts Person, notifies Formspree
POST   /api/newsletter/subscribe     subscribe — upserts Person
POST   /api/newsletter/unsubscribe   unsubscribe by email

# Paintings (public read, admin write)
GET    /api/paintings                list (filters: subject, status, featured, search)
GET    /api/paintings/:id            single by id or slug
POST   /api/paintings                [admin] create
PUT    /api/paintings/:id            [admin] update
DELETE /api/paintings/:id            [admin] delete
GET    /api/paintings/:id/download   [admin] proxy-stream full-res from R2

# Uploads
POST   /api/uploads/image            [admin] single image → R2 (returns URLs + dimensions)
POST   /api/uploads/bulk             [admin] batch upload → R2, auto-creates Painting records

# Admin reads / updates
GET    /api/contact                  [admin] list messages
PATCH  /api/contact/:id/read         [admin] mark read
GET    /api/commissions              [admin] list
GET    /api/commissions/:id          [admin] detail
PATCH  /api/commissions/:id          [admin] update status / notes
GET    /api/people                   [admin] list with activity counts
GET    /api/people/:id               [admin] detail with full history
PATCH  /api/people/:id               [admin] update fields
DELETE /api/people/:id               [admin] delete + cascade
GET    /api/newsletter/subscribers   [admin] list
PATCH  /api/newsletter/subscribers/:id  [admin] toggle active
GET    /api/orders                   [admin] list
GET    /api/orders/:id               [admin] detail
POST   /api/orders                   [admin] create invoice
PATCH  /api/orders/:id               [admin] update status
GET    /api/analytics?range=30       [admin] Cloudflare traffic, cached 15 min + persisted to DB

# Auth
POST   /api/auth/login               admin login → access token (15 min) + refresh cookie (7 days)
POST   /api/auth/refresh             silent refresh via HttpOnly cookie
POST   /api/auth/logout              revoke refresh token, clear cookie
GET    /api/auth/me                  current admin payload
```

---

## Auth Flow

```
Login:
  POST /api/auth/login
    → bcrypt.compare(password, person.passwordHash)
    → JWT access token (15 min, in-memory on client)
    → random refresh token (7 days, bcrypt-hashed in DB, HttpOnly cookie)

Authenticated request:
  apiFetch() injects Authorization: Bearer <access_token>
  requireAdmin middleware verifies JWT

Silent refresh (on 401):
  apiFetch() catches 401 → POST /api/auth/refresh
    → finds RefreshToken by bcrypt compare
    → issues new access token
    → retries original request

Logout:
  POST /api/auth/logout → marks RefreshToken.revokedAt in DB, clears cookie

Session restore (page load):
  AuthContext useEffect → POST /api/auth/refresh
    → restores access token from refresh cookie
    → sets isAuthenticated, clears initializing flag
```

---

## Image Upload Flow

```
Single upload (AdminPaintings add/edit modal):
  XHR to POST /api/uploads/image   ← uses getAccessToken() for auth header
    → multer writes temp file to OS tmpdir
    → sharp generates: WebP display (1800px), WebP thumb (400px)
    → original + both variants uploaded to R2
    → returns { imageUrl, thumbUrl, fullResUrl, originalWidth, originalHeight }
    → Prisma record created by client on form save

Bulk upload:
  apiFetch to POST /api/uploads/bulk (one file per request, batched in Admin.tsx)
    → same R2 pipeline as single
    → Painting record auto-created from filename (title, slug, default subject)
    → skips if title already exists
```

---

## Key Architectural Decisions

- **No raw SQL** — all DB access through Prisma
- **No `any` types** — strict TypeScript throughout
- **Tailwind only** — no separate CSS files
- **`normalizePainting()`** in `apiFetch.ts` is the strict mapping from API response to
  frontend `Painting` type. Any new painting field must be added here or it will be silently dropped.
- **`apiFetch`** handles auth injection, silent refresh, and 401 → redirect. All API calls
  go through this — never raw `fetch` in components.
- **R2 originals are immutable** — never modified after upload. DB is the metadata source of truth.
- **Person-as-hub** — `upsertPersonByEmail()` in PersonService is the single entry point for
  all public form submissions. Routes must not duplicate this logic.
- **`prisma migrate dev`** locally, **`prisma migrate deploy`** on Railway (automatic at startup).
  Never `prisma db push` — no migration history.
