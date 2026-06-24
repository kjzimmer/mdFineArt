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
| Backend framework | Express | 4.19 | |
| Backend language | TypeScript + tsx | 5.6 / 4.12 | tsx for dev, tsc for prod |
| Database | PostgreSQL | (Railway managed) | |
| ORM | Prisma | 5.13 | `prisma db push` workflow |
| Auth | jsonwebtoken | 9.0 | JWT, 7-day expiry, admin only |
| Image processing | sharp | 0.34 | resize, metadata, WebP |
| File upload | multer | 1.4 | multipart/form-data handling |
| Image storage | Cloudflare R2 | — | S3-compatible via @aws-sdk/client-s3 |
| Analytics | Cloudflare GraphQL API | — | Zone Analytics + optional RUM beacon |
| Email (contact forms) | Formspree | — | fire-and-forget; replace with Resend for SaaS |
| Hosting | Railway | — | single service, full-stack |
| Version control | GitHub | — | kjzimmer/mdFineArt |
| DNS / CDN / proxy | Cloudflare | — | domain not yet cut over to Railway |

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
| `express` | HTTP server |
| `@prisma/client`, `prisma` | Database ORM |
| `jsonwebtoken` | JWT creation and verification |
| `multer` | File upload middleware |
| `sharp` | Image processing, resize, metadata |
| `@aws-sdk/client-s3` | Cloudflare R2 access (S3-compatible) |
| `cors` | Cross-origin headers |
| `dotenv` | Load `.env` in dev |
| `nodemon`, `tsx` | Dev server hot reload |

---

## Hosting: Railway

- **Service**: single Railway service running both the Express server and serving
  the built React client from `client/dist`
- **Build command**: `npm run build` (builds client via Vite + tsc, then server via tsc)
- **Start command**: `npm run start` (runs `prisma db push` then `node dist/index.js`)
- **Database**: Railway Postgres add-on (same project)
- **Port**: Railway injects `PORT` env var; server listens on `process.env.PORT || 3001`
- **Auto-deploy**: pushes to `main` branch on GitHub trigger Railway deploy automatically

### `railway.toml`

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start"
restartPolicyType = "on_failure"
```

This file pins the build and start commands explicitly — prevents Railway from using
a stale cached `client/dist` from a previous build.

### Root `package.json` scripts

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build && cd ../server && npm install && npm run build",
    "start": "cd server && npm run start",
    "dev": "concurrently \"cd client && npm run dev\" \"cd server && npm run dev\""
  }
}
```

---

## Cloudflare Services in Use

| Service | Purpose | Config |
|---|---|---|
| DNS | Domain management for melodydebenedictis.com | Orange cloud proxy enabled |
| R2 | Image storage (paintings, hi-res originals) | Bucket + public URL via `R2_*` env vars |
| Zone Analytics | Traffic data (requests, unique visitors, countries) | `CF_ZONE_ID` + `CF_ANALYTICS_TOKEN` |
| Web Analytics (RUM) | Top pages, referrers, device types | Requires JS beacon in `index.html`; optional |

**API token scope**: one token per domain, `Analytics:Read` permission only, scoped to
specific zone. Stored in Railway as `CF_ANALYTICS_TOKEN`.

---

## External Services

| Service | Purpose | Status |
|---|---|---|
| Cloudflare R2 | Image storage | Live |
| Cloudflare Analytics | Traffic analytics | Live (domain still on Weebly) |
| Formspree | Contact form email notifications | Live (optional; fires on contact submit) |
| Square | Payment processing for originals + prints | Planned — not yet implemented |
| Resend | Transactional email (receipts, newsletter) | Planned — replace Formspree for SaaS |
| GitHub | Source control | Live — kjzimmer/mdFineArt |
| Railway | Hosting + managed Postgres | Live |

---

## Build Pipeline

```
GitHub push to main
    ↓
Railway detects push (webhook)
    ↓
railway.toml: buildCommand = "npm run build"
    ↓
  root npm run build:
    cd client && npm install && npm run build   → client/dist/
    cd server && npm install && npm run build   → server/dist/
    (server build: prisma generate && tsc)
    ↓
railway.toml: startCommand = "npm run start"
    ↓
  root npm run start:
    cd server && npm run start
    (server start: prisma db push && node dist/index.js)
    ↓
Express serves client/dist as static files + API on same port
```

---

## Dev Environment

```bash
# Client dev server
cd client && npm run dev      # http://localhost:5173

# Server dev server
cd server && npm run dev      # http://localhost:3001
                              # (nodemon + tsx, hot reload on src/ changes)

# Database
npx prisma studio             # visual DB browser
npx prisma db push            # push schema changes to DB (no migration files)

# Type checking
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

Client proxies API requests to `:3001` in dev via Vite config.
In production, client is served from Express static middleware — same origin, no proxy needed.

---

## Planned Additions (not yet implemented)

- **Square Web Payments SDK** — originals + prints checkout
- **Resend** — transactional email (replace Formspree, add newsletter broadcast)
- **DB-backed admin auth** — replace `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars with
  a `User` model and bcrypt password hashing
- **Visitor tracking** — anonymous UUID cookie, `AnonymousVisitor` + `VisitorEvent`
  models, consent banner (spec in `docs/VISITOR_TRACKING_SPEC.md`)
- **Cloudflare RUM beacon** — enables top pages / referrers / device types in analytics
- **DailyAnalytics DB table** — accumulate Cloudflare data beyond 30-day retention window
