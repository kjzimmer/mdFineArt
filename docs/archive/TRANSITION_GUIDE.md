# Transition Guide
**Version:** 1.0
**Date:** June 2026
**Prepared by:** Claude.ai architectural session

---

## Purpose

This guide accompanies `SHARED_TECH_STACK.md` and `SHARED_ADMIN_MODULES.md`.
It gives each Claude Code session the context needed to assess and execute the
transition to the shared standards across all four sites.

**Read this guide and all files in this folder before doing anything.**

---

## Process — Follow This Exactly

### Step 1 — Assess before acting

Read every file in this folder. Then write `_assessment.md` using the format
specified in `CLAUDE.md` standing rules. Do not make any changes to the repo
until the user has reviewed `_assessment.md` and confirmed the transition plan.

### Step 2 — Wait for confirmation

Present `_assessment.md` to the user. Answer any questions. Resolve any
decisions the user needs to make. Do not proceed until explicitly told to.

### Step 3 — Execute the transition

Follow the confirmed plan. Log any issues that arise in `shared/SHARED_FEEDBACK.md`
as you go — do not silently work around problems.

### Step 4 — Clean up and document

When the transition is complete:
- Move `SHARED_TECH_STACK.md` → `shared/SHARED_TECH_STACK.md`
- Move `SHARED_ADMIN_MODULES.md` → `shared/SHARED_ADMIN_MODULES.md`
- Move `CLAUDE_template.md` → reference only; the actual `CLAUDE.md` stays at root
- Create `shared/SHARED_FEEDBACK.md` if it does not exist
- Remove all remaining files from the temp folder
- Remove the temp folder itself
- Update `## Current State` in `CLAUDE.md`

---

## What the Shared Standards Require

Read `SHARED_TECH_STACK.md` and `SHARED_ADMIN_MODULES.md` in full.
The summary below is for orientation only — the shared docs are authoritative.

### Folder Structure (required for all sites)

```
{repo}/
├── CLAUDE.md                    ← root level (not in docs/)
├── .env.example
├── package.json                 ← scripts only, no dependencies
├── railway.toml
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/admin/
│       ├── pages/
│       ├── lib/apiFetch.ts
│       ├── hooks/
│       ├── types/index.ts
│       └── context/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── middleware/auth.ts
│       ├── routes/
│       ├── services/
│       ├── lib/
│       ├── jobs/               ← omit if site has no scheduled jobs
│       └── scripts/seed-admin.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── TECH_STACK.md
│   ├── ARCHITECTURE.md
│   ├── SITE_DESIGN.md
│   ├── CONTENT.md              ← content-heavy sites only
│   ├── wip/
│   └── archive/
├── shared/
│   ├── SHARED_TECH_STACK.md
│   ├── SHARED_ADMIN_MODULES.md
│   └── SHARED_FEEDBACK.md
└── incoming/                   ← permanent; empty after transition
```

### Tech Stack (required for all sites)

| Layer | Required |
|-------|---------|
| Language | TypeScript strict mode — no .js in src/ |
| Framework | Express 5 |
| Frontend | React 18 + Vite |
| ORM | Prisma 6 |
| Prisma workflow | migrate dev + migrate deploy — never db push |
| Prisma generator | `provider = "prisma-client-js"` |

### Auth (required for all sites)

- DB-backed credentials on `Person` model (`isAdmin`, `passwordHash`)
- Never env var credentials
- Hardened JWT: 15-min access token + 7-day refresh token in HttpOnly cookie
- `RefreshToken` table for explicit revocation
- Access token in memory only — never localStorage

### Admin Modules (required for all sites)

- People CRM (Person-as-hub, upsert on email)
- Contact inbox (unified, mark-read)
- Cloudflare analytics (Zone Analytics, DailyAnalytics persistence)
- Rate limiting on all public endpoints + login

---

## Site-Specific Notes

### AbundanceArchitecture.world

**Key gaps to assess:**
- `CLAUDE.md` is currently in `docs/` — must move to repo root
- Folder structure uses `src/` + `admin/` — needs to migrate to `server/` + `client/`
- Auth uses 7-day access token in localStorage — needs hardened JWT pattern
- `DailyAnalytics` model exists — analytics persistence is ahead of other sites
- `shared-tech-stack-v1.1.md` exists but is not in the standard location or format —
  replace with `SHARED_TECH_STACK.md` from this folder

**Docs to create:**
- `docs/ARCHITECTURE.md` — extract schema + API routes from CLAUDE.md
- `docs/SITE_DESIGN.md` — CSS approach not yet documented
- `docs/TECH_STACK.md` — site-specific additions to shared stack

**Docs to update:**
- `CLAUDE.md` — move to root, slim to template format, strip detail into companion docs
- `docs/REUSABLE_ADMIN_MODULES.md` — superseded by `shared/SHARED_ADMIN_MODULES.md`;
  move to `docs/archive/`

---

### FreeMarketWatch.world

**Key gaps to assess:**
- ORM: currently raw `pg` — needs migration to Prisma 6. This is the most significant
  technical change on this site. Assess scope carefully before committing to a plan.
  The data pipeline tables (market_*, fetch_log) are FMW-specific and complex.
  The admin tables (admin_people, admin_contact_messages, user_accounts) are the
  priority for Prisma migration. Market/pipeline tables can follow separately.
- Auth: uses separate `user_accounts` table — needs to merge into `Person` model
  or document as a site-specific exception with a migration path
- Auth token: 7-day access token in localStorage — needs hardened JWT pattern
- Analytics: no `DailyAnalytics` persistence — needs to be added
- `CLAUDE.md` is at root ✓ but is very large — needs to be slimmed to template format
- `REUSABLE_ADMIN_MODULES.md` is at root — move to `docs/archive/`
- `FMW_TechStack.md` is in `docs/` ✓ but needs to be reformatted as `docs/TECH_STACK.md`

**Docs to create:**
- `docs/SITE_DESIGN.md` — WEBDESIGN_SKILL.md has the right content; extract and reformat
- `shared/SHARED_FEEDBACK.md` — log raw pg → Prisma migration complexity here

**Docs to update:**
- `CLAUDE.md` — slim to template format; move detail to companion docs
- `docs/ARCHITECTURE.md` — FMW_Architecture.md likely has most of this content;
  reformat to standard structure

**Flag for user before proceeding:**
The raw `pg` → Prisma migration on FMW is the most complex transition across all sites.
Do not attempt it in a single session. Propose a phased plan:
  1. Phase 1: Admin tables only (admin_people, admin_contact_messages, user_accounts → Person)
  2. Phase 2: Market/pipeline tables (market_*, fetch_log) — separate session
  3. Phase 3: Remove raw pg dependency entirely
Log the phased plan in `_assessment.md` and wait for user confirmation.

---

### HealthUnveiled.world

**Context:** This site is at an early stage — static HTML teaser page, no admin
foundation yet. It is effectively a greenfield from the shared standards perspective.

**Key gaps to assess:**
- Determine current repo structure — it may not yet have server/ + client/ separation
- No admin modules likely implemented yet
- No Prisma schema likely exists yet

**Approach:**
Rather than migrating existing code, this site mostly needs the standard structure
set up from scratch and the shared docs put in place. The transition here is additive
rather than corrective.

**Docs to create (all of them):**
- `CLAUDE.md` from template — fill in site-specific sections
- `docs/TECH_STACK.md`
- `docs/ARCHITECTURE.md`
- `docs/SITE_DESIGN.md`
- `shared/SHARED_FEEDBACK.md`

**Flag for user:**
If the existing HTML teaser page is approved design (like AA's public/index.html),
confirm before touching it. Add it to the "What Never Changes" section of CLAUDE.md.

---

### melodydebenedictis.com (mdFineArt)

**Key gaps to assess:**
- Auth: currently env var credentials (`ADMIN_EMAIL`/`ADMIN_PASSWORD` plaintext) —
  this is a security issue; migrating to DB-backed auth on Person model is priority
- Prisma: on version 5.13 — needs upgrade to Prisma 6
- Prisma workflow: using `db push` — needs to switch to `migrate dev`. This requires
  creating an initial migration from the existing schema. See migration note below.
- Auth token: stored in localStorage — needs hardened JWT pattern
- `CLAUDE.md` is at root ✓ but contains full API routes — extract to `docs/ARCHITECTURE.md`
- Analytics: `DailyAnalytics` model exists in spec — confirm whether it is in the
  live schema and implemented in the analytics route

**Prisma db push → migrate dev migration note:**
Switching from `db push` to `migrate dev` on a live database requires a baseline
migration. The process is:
1. `npx prisma migrate dev --name baseline --create-only`
2. Manually verify the generated SQL matches the live schema exactly
3. `npx prisma migrate resolve --applied baseline`
4. From this point, `prisma migrate dev` works normally
Do not run `migrate dev` without the baseline step — it will attempt to re-create
existing tables and fail or cause data loss.

**Docs to update:**
- `CLAUDE.md` — extract API routes to ARCHITECTURE.md, slim to template format
- `docs/REUSABLE_ADMIN_MODULES.md` → `docs/archive/`
- `docs/TECH_STACK.md` — already exists ✓; update version numbers, add deviations section

**Flag for user before proceeding:**
Auth migration (env vars → DB-backed) is the highest priority change on this site.
Confirm the transition plan before touching any auth code — the site is live and
a broken login will lock out the admin panel.

---

## Shared Docs Setup (all sites)

Every site needs a `shared/` folder with these three files after transition:

```
shared/
├── SHARED_TECH_STACK.md      ← copy from this temp folder
├── SHARED_ADMIN_MODULES.md   ← copy from this temp folder
└── SHARED_FEEDBACK.md        ← create fresh; use template below
```

**SHARED_FEEDBACK.md starting template:**

```markdown
# Shared Doc Feedback
**Site:** {site name}
**Governance:** CC appends here when shared docs have gaps, conflicts, or errors.
Never edit SHARED_TECH_STACK.md or SHARED_ADMIN_MODULES.md directly.
This file is reviewed in Claude.ai and resolved there.

---

{entries go here — see CLAUDE.md standing rules for entry format}
```

---

## Questions to Answer in _assessment.md

Every `_assessment.md` must address:

1. What is the current folder structure and how far does it deviate from the standard?
2. What is the current auth implementation and what is the migration path?
3. Is Prisma in use? What version? What workflow?
4. Are admin modules implemented? Which ones? Any gaps vs the shared spec?
5. What docs exist and which standard docs are missing?
6. What is the single biggest risk in this transition?
7. What needs a user decision before proceeding?
8. Are there any issues with the shared docs themselves that need to be logged?
