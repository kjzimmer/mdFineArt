# Product Roadmap

This is the agreed phasing for evolving the platform from a single-artist site into a gallery SaaS product. Read this before starting any new major feature to understand where it fits.

**Target:** 3–5 early adopter artists to validate the platform before broader outreach.

**AI-native objective:** At every phase, prefer AI-assisted operations over manual processes — for the platform operator, for gallery owners, and for gallery visitors. The AI customer sidebar in Phase 2 is the first deployment of this principle; later phases expand it into a full AI business team supporting Karl, gallery owners, and visitors.

---

## Phase 1 — Multi-Tenant Foundation ✓ COMPLETE

- **Multi-tenant scaffold** — `Gallery` model, `galleryId` FKs on all tables, gallery-scoped auth JWT ✓
- **App admin (basic)** — provision galleries, assign gallery admins, `isAppAdmin` flag, gallery delete, member set-password, welcome email on onboarding ✓
- **Custom domain routing** — Cloudflare Worker per client zone → `fallback.mygalleryworks.com` → Railway wildcard; no per-client Railway custom domain ✓
- **Gallery admin config (full)** — complete per-gallery configuration: site identity, landing page, social links, commission page, contact form, about page, site feature toggles, contact email; all fields auto-save; all defaults gallery-agnostic ✓
- **Auth & password management** — DB-backed login, refresh tokens, email-based password reset, per-gallery member credentials management ✓
- **Form notifications** — Resend replaces Formspree; per-gallery recipient resolution (contactEmail → first admin member email) ✓

---

## Phase 2 — Early Adopter MVP
*Build this, then approach prospective clients.*

- **Works rename** — generalize "paintings" to "works" throughout DB, API, and UI; broadens the platform beyond painters to all visual artists
- **Site styling** — 3–4 curated themes as CSS variable sets (color palette + font pairing); artists need visual identity differentiation; CSS token level, not separate designs
- **Commerce: inquiry → invoice → payment** — Square integration at the invoice step; dialog-first flow (no cart/checkout); collector inquires → artist creates invoice → collector pays via Square link; learning ground for future bookkeeping integration
- **Blog** — minimal: posts with title, content, date, published toggle; admin management tab
- **Events** — minimal: title, date, venue, description, optional link; admin management tab
- **Free-form custom pages** — artist can create one or more custom nav pages (title, nav label, rich-text content, optional hero image); covers Music, Classes landing, and any other artist-specific need; replaces the need for one-off page types
- **AI customer support sidebar** — per-gallery Claude-powered chat widget on the public site; knowledge base built from each gallery's own data (works, config, commission policies, pricing); starting point for AI-native customer engagement
- **mygalleryworks.com landing page** — describes the MVP product and growth vision; early access interest form for prospective artists to initiate joining; minimal but credible
- **NS verification status** — poll/check whether client has switched nameservers; show status in app admin gallery detail (pending / propagating / live)
- **Commission/inbox polish** — tighten the inquiry → invoice → payment workflow so it feels solid end-to-end

---

## Phase 3 — Early Adopter Engagement
*Onboard 3–5 artists. Observe. React.*

- **Observe usage patterns** — watch what early adopters actually use, what they ignore, what they ask for
- **React to feedback** — build what they specifically request; do not build speculatively
- **Candidates for Phase 3 build** (only if early adopters ask):
  - Classes with registration/booking
  - Reference photo library (per-gallery photo asset management for artists)
  - Advanced styling/layout options beyond Phase 2 themes
  - Gallery owner user management (invite/remove team members from within gallery admin)
- **Begin billing conversations** — informal discussion with early adopters about pricing model before broad outreach

---

## Phase 4 — Prep for Broad Engagement
*Complete before marketing to a wider audience.*

- **Billing infrastructure** — add subscription billing to early adopters; establish pricing tiers before broad outreach
- **Staging environment** — Railway staging env, seed script, scrub script, deploy process
- **Platform admin shell** — `app.mygalleryworks.com` as distinct platform entry point; platform-level login separate from gallery admin
- **Self-service onboarding** — prospective artists can sign up and provision their own gallery without manual app admin intervention
- **AI business team (platform operator)** — AI tools for Karl: managing multiple galleries, flagging issues, onboarding assistance, analytics interpretation; AI-native internal operations
- **NS automation** — complete Cloudflare provisioning automation; NS verification polling
- **Scaling review** — load testing, DB indexing, R2 costs, Railway plan review

---

## Phase 5 — Broad Outreach
*Scale up.*

- **Marketing push** — broader artist outreach beyond personal network
- **AI business team (gallery owners)** — AI writing assistance, inquiry response suggestions, social content generation, business insights per gallery; extends AI-native principle to every gallery owner
- **AI business team (visitors)** — expanded visitor AI beyond customer support; personalized recommendations, collector engagement
- **Advanced commerce** — cart and checkout flow, print SKU catalog via Square, subscription/recurring billing
- **Visitor tracking beacon** — anonymous visitor tracking with consent; spec at `docs/VISITOR_TRACKING_SPEC.md`
- **Accounting integration** — separate accounting app bridge; API TBD
- **Multi-design theme system** — shell + theme npm packages; not separate frontends; see `docs/wip/theme-architecture.md`
- **Blog and Events advanced** — beyond minimal Phase 2 implementations based on early adopter feedback

---

## Deferred Indefinitely

- Forced logout all sessions — defer until multi-tenant SaaS with support staff use case
- Classes registration/booking — build only if early adopters specifically request it

---

## Parking Lot — Unscheduled Ideas
*Good ideas not yet assigned to a phase. Revisit when planning the next phase.*

- **Testimonials** — class and commission testimonials; gallery owners collect and display social proof from students and collectors; likely admin-managed with public display on relevant pages
- **Style sheet token updates** — periodic refresh of the design system CSS variable sets (color palettes, font pairings) as the platform matures and more gallery types onboard; update `docs/SITE_DESIGN.md` when scoped
- **Work sharing link** — single-work shareable URL with rich metadata (title, image, price, artist statement excerpt); copyable link + share-to-message action; useful for DMs, email, and social; distinct from the public gallery page (no nav, focused on the one work)
- **Invoice viewer for paid invoices** — currently a paid invoice URL just shows "Payment received" banner with no invoice details; collector may need to reference what they paid for; also, People management has no invoice history — should show all orders/invoices linked to a person with status and amounts
- **Painting card access from inquiry** — painting inquiries reference a specific work; admin should be able to pull up the painting detail card directly from the inquiry without navigating away; part of the broader inquiry flow discussion (may move to post-Phase 3 along with full inquiry workflow)

---

## Key Architectural Decisions Already Made

| Decision | Choice | Doc |
|----------|--------|-----|
| Multi-tenancy model | Gallery model + galleryId FKs, host-header resolution | `docs/ARCHITECTURE.md` |
| Custom domain routing | Cloudflare Worker sets `X-Gallery-Hostname`; proxies via `fallback.mygalleryworks.com`; NS transfer per client; no Railway custom domain per client | `cloudflare-worker/gallery-router.js` |
| Why not CF for SaaS | CF for SaaS requires client CNAME to be proxied through CF — only works if client is already on CF; NS transfer + Worker achieves same routing with similar friction and no per-hostname fees | memory: project-domain-routing |
| Platform domain | `mygalleryworks.com` = marketing; `app.mygalleryworks.com` = platform admin (Phase 4); `slug.mygalleryworks.com` = gallery previews | Phase 4 backlog |
| Theme system (future) | Shell + theme npm packages; not separate frontends | `docs/wip/theme-architecture.md` |
| Commerce approach | Dialog-first: inquiry → invoice → Square payment link; no cart/checkout for Phase 2 | Phase 2 |
| AI approach | AI-native at every phase; per-gallery knowledge base from live DB data | Phase 2+ |
| Watermark source | `siteTitle` from SiteConfig, read at upload time | code |
| Image storage | Cloudflare R2, originals immutable | `docs/ARCHITECTURE.md` |
| Auth | In-memory access token + HttpOnly refresh cookie | `docs/ARCHITECTURE.md` |
| Staging DB | Separate DB + seed script; prod copy only with scrub | `docs/wip/staging-environment.md` |
