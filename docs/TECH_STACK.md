# Tech Stack — myGalleryWorks.com Platform

*Rewritten 2026-08-03 — the previous version predated Square, Resend, the AI support chat,
and the entire multi-tenant/Cloudflare Worker layer. Versions below are read from
`package.json` directly, not estimated.*

---

## Stack Overview

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Frontend framework | React | 18.2 | |
| Frontend language | TypeScript | 5.6 | strict mode |
| Frontend bundler | Vite | 5.4 | |
| Styling | Tailwind CSS | 3.4 | CSS custom properties for per-gallery themes, no separate CSS files beyond `styles.css` token definitions |
| Routing | React Router | 6.18 | |
| Charts (admin) | Recharts | 3.8 | analytics dashboard only |
| Backend framework | Express | 5.0 | async errors auto-propagate; `req.params` is `string \| string[]` |
| Backend language | TypeScript + tsx | 5.6 / 4.12 | tsx for dev, tsc for prod build |
| Database | PostgreSQL | (Railway managed) | single DB, all galleries |
| ORM | Prisma | 6.x | `prisma migrate dev` workflow |
| Auth | jsonwebtoken + bcryptjs | 9.0 / 3.0 | 15-min access token + 7-day refresh cookie, gallery-scoped |
| Rate limiting | express-rate-limit | 7.x | public endpoints + login |
| Image processing | sharp | 0.34 | resize, WebP conversion, watermarking |
| File upload | multer | 1.4 | disk storage → temp file → R2 |
| Image storage | Cloudflare R2 | — | S3-compatible via `@aws-sdk/client-s3` |
| Analytics | Cloudflare GraphQL API | — | Zone Analytics; daily data persisted to DB per gallery |
| Email | Resend | 6.x | replaced Formspree; onboarding + notifications + password reset + invoices |
| Payments | Square | 45.x | per-gallery OAuth; `square` npm package |
| AI | Anthropic SDK | 0.115.x | admin support chat, model `claude-sonnet-4-6` |
| Domain routing | Cloudflare Worker | — | `cloudflare-worker/gallery-router.js`, one script for all client custom domains |
| Hosting | Railway | — | single service, full-stack |
| Version control | GitHub | — | kjzimmer/mdFineArt |
| DNS / CDN / proxy | Cloudflare | — | per-gallery zones, provisioned via `ProvisioningService.ts` |

---

## Key npm Packages

### Client (`client/package.json`)
| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `recharts` | Admin analytics charts |
| `vite`, `@vitejs/plugin-react` | Build tooling |
| `tailwindcss`, `autoprefixer`, `postcss` | Styling |
| `typescript` | Type checking |

### Server (`server/package.json`)
| Package | Purpose |
|---|---|
| `express` | HTTP server (v5) |
| `@prisma/client`, `prisma` | Database ORM (v6) |
| `jsonwebtoken` | JWT creation and verification |
| `bcryptjs` | Password hashing (admin credentials + refresh/reset token hashing) |
| `cookie-parser` | Parse HttpOnly refresh token cookie |
| `express-rate-limit` | Rate limiting for public + auth endpoints |
| `multer` | File upload middleware (disk storage) |
| `sharp` | Image processing, resize, WebP conversion, watermark compositing |
| `@aws-sdk/client-s3` | Cloudflare R2 access (S3-compatible) |
| `resend` | Transactional email — onboarding, notifications, password reset, invoices |
| `square` | Payment processing — per-gallery OAuth, Web Payments SDK backend |
| `@anthropic-ai/sdk` | Admin support chat |
| `cors` | Cross-origin headers (`origin: true` — required for Vite's `<script type="module">` same-origin asset requests) |
| `dotenv` | Load `.env` in dev |
| `nodemon`, `tsx` | Dev server hot reload |

---

## Hosting: Railway

- **Service**: single Railway service — Express serves both API and built React client from
  `client/dist`, plus the server-rendered public routes (see `docs/ARCHITECTURE.md`)
- **Build command**: `npm run build` → `prisma generate && tsc` (server), `tsc && vite build` (client)
- **Start command**: `npm run start` → `prisma migrate deploy && node dist/index.js`
- **Database**: Railway Postgres add-on, single instance, all galleries
- **Port**: Railway injects `PORT`; server listens on `process.env.PORT || 3001`
- **Auto-deploy**: push to `main` triggers Railway deploy automatically — no staging
  environment yet (see `docs/wip/staging-environment.md`)
- **Domains**: `melodydebenedictis.com` + `mygalleryworks.com`, plus wildcard
  `*.mygalleryworks.com` for gallery previews

### `railway.toml`
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start"
restartPolicyType = "on_failure"
```

---

## Cloudflare Services in Use

| Service | Purpose | Config |
|---|---|---|
| DNS + zone management | Per-client-gallery zone, created via API on custom-domain onboarding | `CF_API_TOKEN`, `CF_ACCOUNT_ID` |
| Worker (`gallery-router.js`) | Single script routes all client custom domains to Railway, sets `X-Gallery-Hostname` | `CF_WORKER_SCRIPT_NAME`, `CF_FALLBACK_ORIGIN` |
| R2 | Image storage (originals + WebP variants), one bucket, key-prefixed | `R2_*` env vars |
| Zone Analytics | Traffic data (requests, unique visitors, countries), per gallery | `CF_ANALYTICS_TOKEN`, zone ID stored per-`Gallery` in DB |

---

## Environment Variables

```bash
# Core
DATABASE_URL=postgresql://...
JWT_SECRET=
NODE_ENV=production            # gates GALLERY_SLUG fallback off, secure cookie flag, etc.
PORT=
CLIENT_URL=                    # used in some redirect/link construction

# Local dev only
GALLERY_SLUG=melody            # bypasses hostname→gallery lookup locally; inert if NODE_ENV=production

# Cloudflare R2 (image storage)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Cloudflare API (per-gallery zone/DNS/Worker provisioning)
CF_API_TOKEN=
CF_ACCOUNT_ID=
CF_ANALYTICS_TOKEN=
CF_PREVIEW_BASE=               # e.g. mygalleryworks.com — preview domain suffix
CF_WORKER_SCRIPT_NAME=
CF_FALLBACK_ORIGIN=            # e.g. fallback.mygalleryworks.com — Worker's proxy target

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=             # onboarding@ and notifications@ split — see server/src/services/EmailService.ts
RESEND_NOTIFY_EMAIL=

# Square (per-gallery OAuth commerce)
SQUARE_APP_ID=
SQUARE_APP_SECRET=
SQUARE_ENVIRONMENT=            # sandbox | production
SQUARE_REDIRECT_URI=

# Anthropic (admin support chat)
ANTHROPIC_API_KEY=

# client — set in client/.env (dev only; production reads from same origin)
VITE_API_URL=http://localhost:3001
```

Admin credentials are stored in the `Person` table (`passwordHash`); seed with
`npm run seed:admin -- email password`. `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars are not used.

---

## Dev Setup

```bash
# Install (from repo root)
npm install

# Run (two terminals)
cd client && npm run dev      # → http://localhost:5173
cd server && npm run dev      # → http://localhost:{PORT from .env}

# DB schema changes
cd server
npx prisma migrate dev --name describe_change   # create + apply migration locally
# commit migration file → Railway applies via prisma migrate deploy at startup

# Seed admin user
npm run seed:admin -- admin@example.com yourpassword

# Browse data
cd server && npx prisma studio
```

---

## External Services — Status

| Service | Purpose | Status |
|---|---|---|
| Cloudflare R2 | Image storage | Live |
| Cloudflare Analytics + Worker | Traffic analytics + custom domain routing | Live |
| Resend | All transactional email | Live |
| Square | Payment processing (per-gallery OAuth) | Live — production OAuth untested (Square sandbox OAuth is broken on their end; production `connect.squareup.com` works normally); token refresh not yet implemented |
| Anthropic API | Admin support chat | Live |
| GitHub | Source control | Live — kjzimmer/mdFineArt |
| Railway | Hosting + managed Postgres | Live |
| Formspree | ~~Contact form email~~ | Removed — replaced by Resend |
