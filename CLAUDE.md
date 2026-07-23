# CLAUDE.md — Melody DeBenedictis Artist Website
*Read this file at the start of every session before doing anything else.*

---

## What This Project Is

Full rebuild of melodydebenedictis.com — a fine art portfolio site for Western oil painter
Melody DeBenedictis. React + TypeScript frontend, Express 5 + Node.js backend, PostgreSQL via
Prisma 6, Cloudflare R2 for image storage, hosted on Railway.

**GitHub:** https://github.com/kjzimmer/mdFineArt
**Production:** melodydebenedictis.com (Railway)

---

## Current State

**Live:**
- Public pages: home (hero slideshow), gallery (lightbox, inquire modal), about, commission request, contact
- Admin left-nav shell with tabs: Paintings, Commissions, Inbox, People, Orders, Analytics, Configuration
- Admin — Paintings: CRUD, bulk image upload to R2, print-tier detection from resolution
- Admin — Inbox: contact messages, mark read
- Admin — Commissions: list, status/notes update
- Admin — People: CRM, full activity history, create invoice shortcut
- Admin — Orders: invoice create/status
- Admin — Analytics: Cloudflare zone analytics with daily persistence to DB
- Admin — Configuration: full site config panel (see below)
- Auth: DB-backed admin login (bcrypt), 15-min access token in memory + 7-day refresh cookie
- Rate limiting: public form endpoints (10/15 min), login (5/15 min)

**Site Configuration panel (Admin → Configuration):**
- Site Info card: gallery title, artist name, footer tagline (three live fields only)
- Landing Page card: primary/secondary taglines, social links, hero background image, hero slideshow
- Site Features card: commission toggle + title/paragraphs/slideshow sub-settings, newsletter toggle, events toggle, featured works toggle + count, show prices toggle
- Contact Us Form card: heading, body paragraphs, contact photo + caption
- About Page card: bio subtitle, bio paragraphs, artist portrait upload, professional memberships (name/level/logo/url), artist statement subtitle, statement paragraphs, statement image, shows, awards, media, past galleries
- In Development card: contact email/phone, studio location, timezone, SEO/OG fields (saved but not yet wired)
- All cards collapsible (start collapsed); all fields auto-save on blur or toggle
- Social links: URL-first entry, platform detected automatically from URL (13 platforms + generic fallback); icons shown in TopNav
- Hero background image: upload to R2, stored in SiteConfig; replaces old hardcoded painting search
- Slideshow: DB-backed (SlideshowSlide model), reusable SlideshowEditor (admin) and SlideshowDisplay (public); contexts: "landing", "commission"
- Commission page: shows slideshow in right column of intro card when slides are configured
- Footer: driven by config.siteTitle and config.taglineFooter
- Watermark text on uploaded images pulled from siteTitle at upload time (previously hardcoded)
- About page: fully config-driven with hardcoded fallbacks until admin populates; fallbacks to be removed once Melody populates her data

**In flight:**
- Nothing currently in flight

**Deferred:**
- Multi-tenant scaffold (Gallery model + galleryId FKs + per-gallery auth) — designed, not started; **next priority**
- Remove About page hardcoded fallbacks once Melody populates config in production
- App admin (super-admin across all galleries) — follows multi-tenant scaffold
- Staging environment — designed, not provisioned yet
- Inbox: conversation threading, mark resolved, email integration (Resend)
- Blog and Events admin tabs (UI stubs exist)
- Square/Stripe payment integration (per-gallery credential model TBD)
- Promotion / AI discoverability (replaces traditional SEO focus)
- Visitor tracking / analytics beacon — spec in `docs/VISITOR_TRACKING_SPEC.md`
- Forced-logout-all-sessions feature — defer until multi-tenant SaaS (see memory notes)
- Gallery of paintings refinements (several UX improvements identified)

---

## Doc Map

*Read the relevant doc before starting any task in that area. Do not rely on memory.*

| Doc | Read it for |
|-----|------------|
| `docs/ROADMAP.md` | **Read this first for any new feature** — 6-phase plan, key decisions, what's deferred |
| `docs/ARCHITECTURE.md` | DB schema, API routes, data flows, key architectural decisions |
| `docs/SITE_DESIGN.md` | Design system, CSS tokens, layout conventions, component patterns |
| `docs/TECH_STACK.md` | Stack versions, package choices, hosting config, build pipeline |
| `docs/VISITOR_TRACKING_SPEC.md` | Spec for anonymous visitor tracking (not yet implemented) |

---

## Critical Gotchas

- **Images in R2 are immutable** — originals uploaded to R2 are never modified after upload. DB is the metadata source of truth. Never write back to or modify R2 originals.
- **Prisma workflow** — `prisma migrate dev` locally, `prisma migrate deploy` on Railway (runs automatically at startup). Never `prisma db push`.
- **Access token in memory only** — never localStorage or sessionStorage. Token lives in the `_accessToken` module variable in `client/src/lib/apiFetch.ts`.
- **apiFetch not fetch** — all API calls from components go through `apiFetch` in `client/src/lib/apiFetch.ts`. It handles auth injection and silent token refresh on 401. Never raw `fetch` in components.
- **XHR upload uses getAccessToken()** — AdminPaintings.tsx uses XHR (not apiFetch) for upload progress tracking. It reads the token via `getAccessToken()` exported from `apiFetch.ts`. Never localStorage.
- **CORS must be `origin: true`** — Vite builds `<script type="module">` tags that send Origin headers even for same-origin asset requests. A restrictive allowlist returns 500 on all assets in production.
- **`@map` convention** — existing schema fields use camelCase column names (known deviation from snake_case standard). New fields use snake_case with `@map`.
- **Express 5 params** — `req.params.*` is `string | string[]`. Always wrap in `String()` before passing to Prisma where clauses.

---

## What Never Changes

- **R2 originals** — do not modify, re-upload, or delete original image files in R2 under any circumstances
- **`docs/SITE_DESIGN.md`** — approved design system; do not restyle or restructure components without consulting this doc

---

## Standing Rules

*These rules apply to every session. Do not modify this section.*

### Session Start Checklist

Before doing anything else at the start of every session:

1. Check `incoming/` — if files are present, notify the user and ask whether to run
   the transition process before proceeding with other work
2. Read this file completely
3. Read the docs relevant to the current task (see Doc Map above)
4. Check `docs/wip/` for any features in flight that relate to the current task

### What CC Can and Cannot Edit

| Location | Permission |
|----------|-----------|
| `## Current State` section of this file | Read + Write |
| Everything else in this file | Read only |
| `docs/wip/*.md` | Read + Write |
| `docs/archive/` | No access — archiving is done manually |
| `docs/ARCHITECTURE.md` | Read only |
| `docs/TECH_STACK.md` | Read only |
| `docs/SITE_DESIGN.md` | Read only |
| All source files (`server/`, `client/`, `prisma/`) | Read + Write |

If something in a read-only doc is wrong or needs updating, note it in the session
and ask the user to update it manually.

### WIP File Discipline

- Every feature in active development gets a file: `docs/wip/{feature-name}.md`
- Name the file after the feature, not generically (never `temp.md` or `wip.md`)
- The wip file is the authoritative spec for that feature while it is in flight
- When the feature ships, notify the user — do not archive the wip file yourself

### Code Quality Rules

- No `.js` files in `src/` — TypeScript only
- No `any` types without an explicit comment explaining why
- No hardcoded secrets — all sensitive values from environment variables
- Never commit `.env`
- Shared business logic (upsert-person, form submission, notification) lives in `server/src/services/` — not duplicated across routes
