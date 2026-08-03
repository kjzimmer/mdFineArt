# myGalleryWorks.com

Multi-tenant gallery SaaS platform. The first tenant is melodydebenedictis.com — a fine art
portfolio site for Western oil painter Melody DeBenedictis. React + TypeScript frontend,
Express 5 + Node.js backend, PostgreSQL via Prisma 6, Cloudflare R2 for image storage, hosted
on Railway.

**Start here:** [`CLAUDE.md`](./CLAUDE.md) — current state, active work, standing rules.
Full docs in [`docs/`](./docs) — see CLAUDE.md's Doc Map for what covers what.

## Workspace
- `client/` — React + TypeScript + Tailwind frontend (public gallery pages, gallery admin,
  platform app-admin)
- `server/` — Express + TypeScript API, Prisma/Postgres, R2 image pipeline, server-rendered
  public content for search/AI discoverability
- `cloudflare-worker/` — the Worker script that routes client custom domains to Railway

## Getting started
```bash
npm install

cd client && npm run dev      # → http://localhost:5173
cd server && npm run dev      # → http://localhost:{PORT}, see server/.env
```
See [`docs/TECH_STACK.md`](./docs/TECH_STACK.md) for environment variables and full dev setup.
