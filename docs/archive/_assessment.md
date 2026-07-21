# Transition Assessment — mdFineArt (melodydebenedictis.com)
**Date:** 2026-06-24
**Incoming files:** TRANSITION_GUIDE.md, CLAUDE_template.md, SHARED_ADMIN_MODULES.md, SHARED_TECH_STACK.md

---

## Summary

mdFineArt is the most feature-complete site in the suite but has three compounding gaps
that need to be resolved in sequence before anything else: auth (env var credentials → DB),
Prisma (v5 + db push → v6 + migrate dev), and service layer (routes call Prisma directly).
The site is live, so the auth migration and Prisma workflow change both need careful baseline
steps. Everything else — folder restructuring, docs, rate limiting — is lower risk and can
follow. No blocking issues that prevent starting, but the auth gap is a security concern
and should be the first item completed.

---

## Gap Analysis

### Auth
**Current state:** `ADMIN_EMAIL` and `ADMIN_PASSWORD` in env vars (plain text comparison).
Single access token (7-day JWT) stored in `localStorage`. No refresh token. No bcrypt.
No `RefreshToken` table.

**Required state:** DB-backed credentials on `Person` (`isAdmin`, `passwordHash` via bcrypt).
15-min access token in memory only. 7-day refresh token in HttpOnly cookie. `RefreshToken`
table for explicit revocation. `seed-admin.ts` script for first-run setup.

**Gap:** Complete replacement of auth pattern. The JWT middleware is thin (`requireAdmin` in
`server/src/middleware/auth.ts`) — easy to swap. The frontend `apiFetch` already handles 401
redirect — needs upgrade to silent refresh before redirect. Admin login form needs to store
access token in memory (React state / context) not localStorage.

**Complexity:** High
**Blocking issues:** Site is live. A broken login locks out the admin panel entirely.
Do not attempt in-session without a recovery plan (direct DB access via Railway to reset
credentials if needed).

---

### Prisma Version and Workflow
**Current state:** Prisma 5.13. Using `prisma db push` (no migration history). Schema at
`server/prisma/schema.prisma`. No `@map` decorators — fields are camelCase in both schema
and DB.

**Required state:** Prisma 6. Migration workflow: `prisma migrate dev` locally,
`prisma migrate deploy` on Railway. Schema at `prisma/schema.prisma` (repo root).
`@map` decorators for snake_case DB columns.

**Gap:**
1. Move `server/prisma/` → `prisma/` (repo root). Update `package.json` and `tsconfig`
   paths accordingly.
2. Upgrade Prisma 5 → 6 (check for breaking changes in generated client).
3. Create baseline migration from existing live schema (see baseline process in
   TRANSITION_GUIDE.md). This must happen before any further schema changes.
4. Update `railway.toml` start command: `npx prisma migrate deploy && npm run start`
5. `@map` decorators: low priority — existing DB columns are camelCase already;
   adding `@map` to change them would require a migration and column renames.
   Recommend: add `@map` on new fields only, document existing fields as a
   known deviation in `docs/TECH_STACK.md`.

**Complexity:** Medium-High
**Blocking issues:** The baseline migration step requires careful manual verification
against the live schema. Do not skip it — running `migrate dev` without a baseline
on a live database will attempt to recreate existing tables.

---

### Service Layer
**Current state:** All Prisma calls are directly in route files (`server/src/routes/*.ts`).
No `server/src/services/` folder exists.

**Required state:** Routes call services. Services own all Prisma interactions.
`PersonService.ts` and `ContactService.ts` at minimum.

**Gap:** Extract DB logic from routes into service files. The shared admin modules
(`SHARED_ADMIN_MODULES.md`) define `PersonService.upsertPerson()` and
`ContactService.createMessage()` as the canonical patterns.

**Complexity:** Medium
**Blocking issues:** None — can be done incrementally. Refactor one route at a time.

---

### Folder Structure
**Current state:**
- `server/prisma/` — should be `prisma/` at repo root
- No `server/src/services/` folder
- `client/src/lib/api.ts` — should be `apiFetch.ts` per standard
- No `shared/` folder
- No `incoming/` folder
- `docs/_transition/` used as temp working folder (non-standard location)
- No `server/src/scripts/seed-admin.ts`

**Required state:** See SHARED_TECH_STACK.md repo structure diagram.

**Gap:** Mostly mechanical moves. The `prisma/` relocation is the most impactful
because it affects build scripts, Railway start command, and tsconfig.

**Complexity:** Low (except prisma/ relocation which couples with the Prisma upgrade)
**Blocking issues:** None standalone, but prisma/ move should happen together with
the Prisma upgrade, not separately.

---

### Admin Modules
**Current state:**
- ✅ People CRM — implemented (`AdminPeople.tsx` + `server/src/routes/people.ts`)
- ✅ Contact Inbox — implemented (`AdminContact.tsx` + `server/src/routes/contact.ts`)
- ✅ Analytics (Zone Analytics) — implemented; Cloudflare env vars live in Railway
- ❌ DailyAnalytics persistence — `DailyAnalytics` model is in the spec
  (`docs/archive/ADMIN_ANALYTICS.md`) but not in `server/prisma/schema.prisma`.
  Analytics route fetches from Cloudflare but does not write to DB.
- ❌ Rate limiting — `express-rate-limit` not installed; no rate limiting on any
  public endpoint (contact form, newsletter subscribe, auth login).
- ❌ `sourceSite` field — not on `ContactMessage` or `NewsletterSubscriber`.
  Required by shared standard for cross-site attribution.

**Complexity:** Low-Medium (DailyAnalytics and sourceSite are schema additions;
rate limiting is a new middleware install)
**Blocking issues:** None

---

### Express Version
**Current state:** Express 4.19
**Required state:** Express 5
**Gap:** Named wildcards required in Express 5 (`/admin/*path` not `/admin/*`).
This site serves the frontend at `app.get('*', ...)` — needs to change to
`app.get('/*path', ...)`. Check all wildcard routes before upgrading.
**Complexity:** Low
**Blocking issues:** None — small targeted change

---

### Railway devDependencies Gotcha
**Current state:** `vite`, `typescript`, `@types/*`, `tsx`, `nodemon` are all in
`devDependencies` in `client/package.json` and `server/package.json`. Railway injects
`NODE_ENV=production` at build time which causes `npm install` to skip devDependencies.
The build currently works because Railway appears to be installing all deps regardless,
but this is fragile — see SHARED_TECH_STACK.md Gotchas section.
**Required state:** All build-time tools in `dependencies` not `devDependencies`.
**Complexity:** Low
**Blocking issues:** None — low priority but worth fixing to avoid silent deploy failures

---

### CLAUDE.md Format
**Current state:** `CLAUDE.md` contains full API routes table and architectural details —
these should live in `docs/ARCHITECTURE.md`. Does not follow the template format from
`CLAUDE_template.md`. Missing: Doc Map, Critical Gotchas, What Never Changes, Standing Rules,
Current State section.

**Required state:** `CLAUDE.md` slimmed to template format. API routes and DB schema
details extracted to `docs/ARCHITECTURE.md`.

**Complexity:** Low
**Blocking issues:** None

---

### Docs
**Current state:**
- ✅ `docs/TECH_STACK.md` — exists, accurate
- ✅ `docs/SITE_DESIGN.md` — exists, accurate
- ❌ `docs/ARCHITECTURE.md` — missing (API routes are in CLAUDE.md)
- ❌ `shared/` folder — missing
- ❌ `incoming/` folder — missing
- `docs/REUSABLE_ADMIN_MODULES.md` — superseded by `shared/SHARED_ADMIN_MODULES.md`;
  move to `docs/archive/`

**Complexity:** Low
**Blocking issues:** None

---

## Transition Plan (proposed order)

**Phase 1 — Auth (highest priority, highest risk)**
1. Add `bcryptjs` to server dependencies
2. Add `isAdmin` + `passwordHash` fields to `Person` model
3. Add `RefreshToken` model to schema
4. Push schema changes (`prisma db push` one last time before switching workflows)
5. Create `server/src/scripts/seed-admin.ts`; run it against Railway DB to create first admin
6. Replace `server/src/routes/auth.ts` with hardened JWT pattern
7. Update `server/src/middleware/auth.ts` with `AdminPayload` typed interface
8. Update `client/src/lib/api.ts` → `apiFetch.ts`: memory-only access token,
   silent refresh on 401, redirect only if refresh also fails
9. Update `AuthContext.tsx` to store access token in React state not localStorage
10. Remove `ADMIN_EMAIL` / `ADMIN_PASSWORD` from Railway env vars after confirming login works
11. Add `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me` routes

**Phase 2 — Prisma upgrade + migrate workflow**
1. Move `server/prisma/` → `prisma/` at repo root
2. Update `server/package.json` build/start scripts for new path
3. Upgrade `prisma` + `@prisma/client` to v6
4. Run `npx prisma generate` to confirm no breaking changes in client
5. Create baseline migration (see TRANSITION_GUIDE.md baseline process)
6. Update `railway.toml` start command: `npx prisma migrate deploy && npm run start`
7. Add `DailyAnalytics` model via `prisma migrate dev`
8. Add `sourceSite` field to `ContactMessage` and `NewsletterSubscriber` via migration

**Phase 3 — Service layer**
1. Create `server/src/services/PersonService.ts`
2. Create `server/src/services/ContactService.ts`
3. Refactor `people.ts`, `contact.ts`, `newsletter.ts` routes to call services

**Phase 4 — Remaining gaps (low risk)**
1. Rate limiting: install `express-rate-limit`, apply to contact/subscribe/auth/login
2. Express 4 → 5: update package, fix wildcard routes
3. Move devDependencies build tools to dependencies
4. Folder: rename `api.ts` → `apiFetch.ts`, update imports
5. Docs: create `docs/ARCHITECTURE.md`, slim `CLAUDE.md` to template format
6. Docs: create `shared/` folder, copy shared docs, create `SHARED_FEEDBACK.md`
7. Docs: create `incoming/` folder with `.gitkeep`
8. Docs: move `docs/REUSABLE_ADMIN_MODULES.md` → `docs/archive/`
9. Analytics: wire DailyAnalytics persistence into analytics route

---

## Questions for User

1. **Auth migration recovery plan** — if the login breaks mid-migration, we need a way to
   reset. Confirm you have Railway CLI access or can connect to the Railway Postgres instance
   directly to run the seed-admin script manually if needed.

2. **Prisma `@map` decorators** — existing DB columns are camelCase (not the shared standard's
   snake_case). Fixing this requires a migration that renames columns — disruptive on a live
   DB. Recommend documenting as a known deviation and only applying snake_case to new columns.
   Confirm this is acceptable.

3. **Express 4 → 5** — do you want this included in the current transition or deferred? It's a
   small change but could surface unexpected issues on a live site. Recommend Phase 4 along with
   other low-risk changes.

4. **Timeline** — Phase 1 (auth) should happen in a single focused session with the site
   available for immediate testing after. Phases 2-4 can be done across multiple sessions.
   Confirm you want to start Phase 1 now or in a dedicated session.

---

## SHARED_FEEDBACK Entries

The following issues were found in the shared docs that need to be logged:

**SHARED_ADMIN_MODULES.md — Analytics section, CF_WEB_ANALYTICS_SITE_TAG note:**
The doc states Web Analytics requires "Cloudflare Pro plan." This may not be accurate —
the free tier appears to support Web Analytics (RUM) for sites not proxied through
Cloudflare. This site's analytics setup confirmed the Free plan includes Web Analytics.
Recommend verifying and updating the note. (Workaround: document as uncertain in
`docs/ARCHITECTURE.md` until confirmed.)
