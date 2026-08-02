# CLAUDE.md — myGalleryWorks.com Platform
*Read this file at the start of every session before doing anything else.*

---

## What This Project Is

Multi-tenant gallery SaaS platform. The first tenant is melodydebenedictis.com — a fine art
portfolio site for Western oil painter Melody DeBenedictis. React + TypeScript frontend,
Express 5 + Node.js backend, PostgreSQL via Prisma 6, Cloudflare R2 for image storage,
hosted on Railway.

**GitHub:** https://github.com/kjzimmer/mdFineArt
**Production:** melodydebenedictis.com + mygalleryworks.com (Railway)
**SaaS domain:** mygalleryworks.com

---

## Current State

**Live:**
- Public pages: home (hero slideshow), gallery (lightbox, inquire modal), about, commission request, contact
- Admin left-nav shell with tabs: Works, Commissions, Inbox, People, Orders, Analytics, Configuration
- Admin — Works: CRUD, bulk image upload to R2, print-tier detection from resolution (renamed from Paintings)
- Admin — Inbox: contact messages, mark read
- Admin — Commissions: list, status/notes update
- Admin — People: CRM, full activity history, create invoice shortcut
- Admin — Orders: full invoice flow — create DRAFT → Send Invoice email → collector pays via public payment page → PAID; line items (original/print/custom), tax, shipping, notes; works auto-marked RESERVED on draft, SOLD on payment; Copy invoice link on sent/paid orders
- Admin — Analytics: Cloudflare zone analytics with daily persistence to DB; shows NS setup banner and "Sample Data" badge when cfZoneId not configured (isMock flag)
- Admin — Configuration: full site config panel (see below)
- Auth: DB-backed admin login (bcrypt), 15-min access token in memory + 7-day refresh cookie
- Rate limiting: public form endpoints (10/15 min), login (5/15 min)
- Password reset: full email-based token flow — forgot password link on login page → Resend email with signed link → /reset-password page → bcrypt hash update + all refresh tokens revoked atomically; PasswordResetToken model with SHA-256 hash, 1hr expiry, single-use; reset URL always uses req.get('host') so link resolves to whichever domain the request came from
- Form notifications: Resend replaces Formspree for contact and commission submissions; recipient resolved via getContactEmail() — SiteConfig.contactEmail falling back to first gallery admin member's email; fire-and-forget (never blocks response)

**Commerce — Square (Phase 2, COMPLETE — merged to main):**
- Per-gallery Square OAuth credentials stored on Gallery model (squareAccessToken, squareRefreshToken, squareTokenExpiresAt, squareMerchantId, squareLocationId)
- OAuth connect flow: GET /api/square/connect → Square authorize → callback → tokens stored; dev bypass (POST /api/square/dev-connect) accepts sandbox personal access token directly (non-production only)
- Public invoice page at /invoice/:token — white-label, no Square branding; Square Web Payments SDK embedded as iframe; card data never touches our server
- Payment processing: POST /api/invoices/public/:token/pay → squareClient.payments.create() with gallery's access token; idempotency key per request
- Order status flow: DRAFT → INVOICE_SENT (on Send) → PAID (on payment) or CANCELLED
- Tax rate per gallery (Gallery.taxRate Float); set in Configuration → Payments card; invoice modal shows rate and has Calculate button to auto-fill from subtotal
- Square integration routes: GET/DELETE /api/square/connect, GET /api/square/callback, GET /api/square/status, PATCH /api/square/settings, POST /api/square/dev-connect
- Public invoice routes mounted before resolveGallery middleware (no gallery context needed — resolved from order.publicToken)
- Production OAuth untested (Square sandbox OAuth broken — returns 400; production connect.squareup.com works normally)
- Token refresh not yet implemented — access tokens expire ~30 days; squareRefreshToken stored for future use
- Payment confirmation email fires after Square card payment and after admin manually marks paid
- Painting inquiry → Invoice button in Inbox pre-fills invoice modal with customer name/email/personId

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
- Watermark text on uploaded images pulled from siteTitle at upload time
- About page: fully config-driven with hardcoded fallbacks until admin populates; fallbacks to be removed once Melody populates config in production
- All placeholder text and defaults are gallery-agnostic (no Melody/Westcliffe-specific values)

**Multi-tenant scaffold — COMPLETE (Phases A + B):**
- Gallery model + GalleryMembership junction table in DB
- galleryId FK on all 11 scoped models (NOT NULL, backfilled)
- Gallery resolution middleware (resolveGallery): reads X-Gallery-Hostname header (set by CF Worker) then falls back to req.hostname; OR[customDomain, previewDomain] DB lookup; GALLERY_SLUG env var for local dev
- JWT gains galleryId + isAppAdmin; login/refresh resolve via GalleryMembership
- requireAdmin validates JWT galleryId matches request gallery
- All API routes scoped by req.gallery.id
- Person.isAdmin still in schema but no longer used for auth (GalleryMembership.isAdmin is authoritative)
- Admin nav title reads from SiteConfig.name (no hardcoded gallery names anywhere)

**App Admin UI — COMPLETE (Phase C):**
- App admin routes behind requireAppAdmin middleware
- Gallery list, gallery detail, member management (add/toggle admin/remove/set-password)
- Gallery create: auto-generates slug, provisions preview domain (DB write only), auto-links cfZoneId, sends welcome email
- Gallery delete: danger zone card with confirmation, cascades all child records in transaction order
- Preview domain: `slug.mygalleryworks.com` per gallery; stored as previewDomain on Gallery
- Gallery detail: auto-provisions preview domain on page load if missing; shows CF nameservers for client handoff
- Add member: generates password if person is new or has no credentials; shows generated password once in UI; never overwrites existing user's password
- Set password: inline form per member for app admin to set a known password
- Welcome email: sent on gallery creation when previewDomain is available; order: NS instructions → preview URL → admin URL → credentials (if new password generated); FROM onboarding@mygalleryworks.com

**Routing architecture — COMPLETE (Worker-based):**

Custom domain routing uses a Cloudflare Worker + NS transfer. This was chosen over Cloudflare
for SaaS (Custom Hostnames) because CF for SaaS requires the client's CNAME to be proxied
through Cloudflare — only possible if the client is already on Cloudflare. The Worker approach
requires NS transfer but achieves identical edge routing with similar client friction and no
Railway custom domains per client needed.

- **Preview domains:** `slug.mygalleryworks.com` — wildcard `*.mygalleryworks.com` registered
  once on Railway; `provisionPreviewDomain` is just a DB write (`CF_PREVIEW_BASE` env var)
- **Client custom domains:** client transfers nameservers to Cloudflare nameservers assigned to
  their zone in our account; fully automated thereafter
- **ProvisioningService** (`server/src/services/ProvisioningService.ts`):
  - `getCfZone`: creates CF zone for client domain with `jump_start: true` (auto-imports existing MX/SPF/TXT)
  - `syncMissingDnsRecords`: adds any records CF missed from the pre-existing authoritative DNS
  - `addClientZoneDns`: replaces A/AAAA/CNAME at root + www with proxied CNAME → Railway
  - `addWorkerRoute`: adds `domain/*` route → gallery-router Worker
  - Gallery stores: `cfZoneId`, `cfNameservers` (shown to client for NS switch), `cfDnsSnapshot` (audit trail)
- **Worker** (`cloudflare-worker/gallery-router.js`): intercepts all traffic at CF edge for any
  client zone, sets `X-Gallery-Hostname: <original-hostname>` header, proxies request to
  `fallback.mygalleryworks.com` (Railway). Single Worker script handles all galleries.
- **resolveGallery middleware:** reads `X-Gallery-Hostname` first, falls back to `req.hostname`;
  looks up gallery by customDomain or previewDomain
- **Scale:** Cloudflare zones and Workers scale to hundreds/thousands of galleries with no
  architectural changes. Cost: Workers Paid $5/month flat. No Railway custom domains needed.

**Email (Resend):**
- FROM_ONBOARDING: `onboarding@mygalleryworks.com` — welcome emails
- FROM_NOTIFICATIONS: `notifications@mygalleryworks.com` — contact, commission, password reset, invoice to collector
- All sends are fire-and-forget; errors logged but never surface to user

**Admin support chat — COMPLETE:**
- Floating chat button (bottom-right, fixed) on every admin page; opens a 520px panel
- Persistent per-gallery conversation history stored in `SupportMessage` DB table — agent builds rapport across sessions
- System prompt in `server/src/routes/support.ts` covers all platform features in practical how-to terms; handles suggestions (explore → detail → log without committing), bugs (steps to reproduce → log high priority), and how-to questions
- Agent has one tool: `log_to_karl({ category, priority, summary, detail })` — writes to `SupportLog` table
- App admin Support Logs tab: view/expand/dismiss captured items across all galleries; color-coded by category and priority
- `ANTHROPIC_API_KEY` env var required; model: claude-sonnet-4-6
- Routes: GET /api/support/history, POST /api/support/chat; GET/DELETE /api/app-admin/support-logs
- This is the full extent of the Phase 2 AI item — the original roadmap concept of a public, visitor-facing AI chat on the gallery site was descoped after early adopter feedback (Melody: high-end gallery visitors expect personal interaction, not AI-mediated); see `docs/ROADMAP.md` Parking Lot

**Invoice UX polish — COMPLETE:**
- Public invoice page always shows full invoice (gallery logo, gallery name, customer name, date, line items, totals) in both paid and unpaid states
- Paid invoices show green PAID badge inline; payment form hidden when paid; all content is print-visible
- @media print in styles.css forces dark-on-white color tokens regardless of gallery theme
- Gallery logo shown left of gallery name in public TopNav when configured
- Auth: background token refresh every 13 min; expired session smoothly shows login form in-place (no stuck state)
- SiteConfig.logoUrl field: uploaded via /api/uploads/config-image, shown in TopNav and on invoices

**Work sharing — COMPLETE:**
- Share button on the public work lightbox (next to Close); deep-links to `/gallery/:slug` — the same gallery page, pre-opened to that work's modal, not a separate single-work page
- Native OS share sheet on mobile (`navigator.share`) when available; falls back to copy-link with a 2s "✓ Link copied" confirmation on desktop, matching the existing "Copy invoice link" pattern
- URL syncs both ways: opening/closing/navigating (prev/next) the lightbox updates the URL via `navigate(..., { replace: true })`; visiting a shared link directly opens that work's modal on load
- Server-rendered OG/Twitter meta tags for `/gallery/:slug` (`server/src/index.ts`, registered before the SPA static/catch-all) so pasted links show the work's image and title in iMessage/Slack/etc — otherwise this is a pure Vite SPA with no per-route HTML, so link previews would be blank; unknown/stale slugs fall through to the generic shell with no error
- `Work.slug` is globally unique, so no gallery-scoping needed for the lookup itself

**In flight:**
- Nothing currently in flight

**Gray area — next session priorities:**
Items that add value but are not hard MVP blockers. Evaluate at the start of each session.
1. mygalleryworks.com landing page — separate repo/deployment (see architecture discussion); interest form for prospective artists
2. NS verification status — poll/check whether client has switched nameservers; show status in app admin gallery detail (pending / active / custom domain live)
4. Resend welcome email button in app admin — resend onboarding email to gallery owner without revealing or resetting their password
5. Full gallery owner user management — gallery owner can invite/remove team members by email from within gallery admin (not just app admin)
6. Favicon — per-gallery favicon upload in Configuration panel
7. App admin UX polish — platform-level tab title/favicon override; session model clarity for cross-gallery navigation
8. Inbox improvements — threading, mark resolved, email reply integration
9. Blog — admin content management (UI stub with mock data only; no server route yet). Note: Events is NOT a stub — it shipped with a full backend (`server/src/routes/events.ts`) and admin CRUD; this line previously conflated the two.
10. Self-service onboarding form — replaces manual gallery creation via app admin (Phase 5)
11. Visitor tracking beacon — spec in `docs/VISITOR_TRACKING_SPEC.md`
12. Unknown gallery redirect — when resolveGallery finds no matching gallery, redirect to mygalleryworks.com instead of returning a blank/broken page
13. R2 bucket restructure (Phase 2 blocker before EA launch) — create mgw-dev and mgw-prod buckets; prefix all upload keys with galleries/{slug}/works/, galleries/{slug}/originals/, galleries/{slug}/config/; write migration script to copy Melody's existing objects and remap all DB image URLs; update env vars; decommission md-fine-art. See session notes for full hierarchy design.

**Deferred (post-MVP):**
- Remove About page hardcoded fallbacks once Melody populates config in production
- Staging environment — designed, not provisioned yet
- Square OAuth token refresh — access tokens expire ~30 days; refresh on payment failure (check squareTokenExpiresAt, call /oauth2/token with refresh_token, store new tokens)
- Additional payment rails (Stripe etc.) — architecture supports it; white-label invoice page and order model are rail-agnostic
- Promotion / AI discoverability (replaces traditional SEO focus)
- Forced-logout-all-sessions feature — defer until multi-tenant SaaS has support staff use case (see memory notes)
- Gallery of works refinements (several UX improvements identified)

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

### Support Agent Sync

The support agent's knowledge is a **static system prompt** in `server/src/routes/support.ts` — it does not read CLAUDE.md at runtime. When any new feature ships:

1. Update `## Current State` in this file as usual
2. Also update the `SYSTEM_PROMPT` constant in `server/src/routes/support.ts` to describe the new feature in practical how-to terms
3. Commit both changes together

Skipping step 2 means gallery owners can ask the agent about a feature and get "I don't know about that" when the feature is live. Do not ship a feature without syncing the agent.

### Code Quality Rules

- No `.js` files in `src/` — TypeScript only
- No `any` types without an explicit comment explaining why
- No hardcoded secrets — all sensitive values from environment variables
- Never commit `.env`
- Shared business logic (upsert-person, form submission, notification) lives in `server/src/services/` — not duplicated across routes
