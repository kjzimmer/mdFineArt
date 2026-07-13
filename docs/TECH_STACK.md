# Tech Stack — Melody DeBenedictis Artist Website

---

## Stack Overview

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Frontend framework | React | 18.2 | |
| Frontend language | TypeScript | 5.6 | strict mode |
| Frontend bundler | Vite | 5.4 | |
| Styling | Tailwind CSS | 3.4 | no separate CSS files |
| Routing | React Router | 6.18 | |
| Charts (admin) | Recharts | 3.8 | analytics dashboard only |
| Backend framework | Express | 5.0 | async errors auto-propagate; `req.params` is `string \| string[]` |
| Backend language | TypeScript + tsx | 5.6 / 4.12 | tsx for dev, tsc for prod |
| Database | PostgreSQL | (Railway managed) | |
| ORM | Prisma | 6.x | `prisma migrate dev` workflow |
| Auth | jsonwebtoken + bcryptjs | 9.0 / 3.x | 15-min access token + 7-day refresh cookie |
| Rate limiting | express-rate-limit | 7.x | public endpoints + login |
| Image processing | sharp | 0.34 | resize, WebP conversion |
| File upload | multer | 1.4 | disk storage → temp file → R2 |
| Image storage | Cloudflare R2 | — | S3-compatible via @aws-sdk/client-s3 |
| Analytics | Cloudflare GraphQL API | — | Zone Analytics; daily data persisted to DB |
| Email (contact forms) | Formspree | — | fire-and-forget; replace with Resend for SaaS |
| Hosting | Railway | — | single service, full-stack |
| Version control | GitHub | — | kjzimmer/mdFineArt |
| DNS / CDN / proxy | Cloudflare | — | melodydebenedictis.com |

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
| `bcryptjs` | Password hashing (admin credentials + refresh token hashing) |
| `cookie-parser` | Parse HttpOnly refresh token cookie |
| `express-rate-limit` | Rate limiting for public + auth endpoints |
| `multer` | File upload middleware (disk storage) |
| `sharp` | Image processing, resize, WebP conversion |
| `@aws-sdk/client-s3` | Cloudflare R2 access (S3-compatible) |
| `cors` | Cross-origin headers |
| `dotenv` | Load `.env` in dev |
| `nodemon`, `tsx` | Dev server hot reload |

---

## Hosting: Railway

- **Service**: single Railway service — Express serves both API and built React client from `client/dist`
- **Build command**: `npm run build` (Vite + tsc client, prisma generate + tsc server)
- **Start command**: `npm run start` → `prisma migrate deploy && node dist/index.js`
- **Database**: Railway Postgres add-on (same project)
- **Port**: Railway injects `PORT`; server listens on `process.env.PORT || 3001`
- **Auto-deploy**: push to `main` triggers Railway deploy automatically

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
| DNS | Domain management for melodydebenedictis.com | Orange cloud proxy, SSL Full |
| R2 | Image storage (originals + WebP variants) | `R2_*` env vars |
| Zone Analytics | Traffic data (requests, unique visitors, countries) | `CF_ZONE_ID` + `CF_ANALYTICS_TOKEN` |
| Web Analytics (RUM) | Top pages, referrers, device types | Optional — requires JS beacon |

**API token scope**: `Analytics:Read`, scoped to specific zone. Stored as `CF_ANALYTICS_TOKEN`.

---

## Environment Variables

```bash
# server — set in Railway Variables
DATABASE_URL=postgresql://...
JWT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
FORMSPREE_CONTACT_ENDPOINT=    # optional — contact form email notifications
CF_ANALYTICS_TOKEN=            # Cloudflare API token, Analytics:Read
CF_ZONE_ID=
CF_ACCOUNT_ID=
CF_WEB_ANALYTICS_SITE_TAG=     # optional — RUM beacon tag

# client — set in client/.env (dev only; production reads from same origin)
VITE_API_URL=http://localhost:3001
```

Note: `ADMIN_EMAIL` and `ADMIN_PASSWORD` are no longer used. Admin credentials are
stored in the `Person` table (`isAdmin`, `passwordHash`). Seed with `npm run seed:admin`.

---

## Dev Setup

```bash
# Install (from repo root)
npm install

# Run (two terminals)
cd client && npm run dev      # → http://localhost:5173
cd server && npm run dev      # → http://localhost:3001

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

## External Services

| Service | Purpose | Status |
|---|---|---|
| Cloudflare R2 | Image storage | Live |
| Cloudflare Analytics | Traffic analytics | Live |
| Formspree | Contact form email notifications | Live (optional) |
| Square | Payment processing for originals + prints | Planned |
| Resend | Transactional email (receipts, newsletter) | Planned — replace Formspree for SaaS |
| GitHub | Source control | Live — kjzimmer/mdFineArt |
| Railway | Hosting + managed Postgres | Live |
