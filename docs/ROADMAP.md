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

- **Works rename** — generalize "paintings" to "works" throughout DB, API, and UI; broadens the platform beyond painters to all visual artists ✓
- **Site styling** — 3–4 curated themes as CSS variable sets (color palette + font pairing); artists need visual identity differentiation; CSS token level, not separate designs ✓ (5 themes shipped)
- **Commerce: inquiry → invoice → payment** — Square integration at the invoice step; dialog-first flow (no cart/checkout); collector inquires → artist creates invoice → collector pays via Square link; learning ground for future bookkeeping integration ✓
- **Events** — minimal: title, date, venue, description, optional link; admin management tab ✓
- **Admin AI assistant** — Claude-powered chat inside the gallery admin that helps the gallery owner use the app itself (how-to guidance, feature discovery, bug/suggestion capture); knows only how the platform works, not the owner's specific data/config, and cannot take actions on their behalf ✓ — descoped from the original "public customer support sidebar" concept; early adopter feedback (Melody) was that high-end gallery visitor interactions need to stay personal, not AI-mediated. See Parking Lot for the shelved public-facing version and the higher-level admin agent idea.
- **mygalleryworks.com landing page** — describes the MVP product and growth vision; early access interest form for prospective artists to initiate joining; minimal but credible — in progress, separate session
- **Work sharing** — share button on the work modal that generates a link back to the gallery page with that work's modal pre-opened, so recipients land directly on the piece; added pre-outreach so each gallery has a shareable, presentable artifact per work ✓
- **Gallery discoverability** — make each gallery findable (SEO fundamentals, AI-discoverability per the platform's promotion strategy); added pre-outreach so early adopters see real findability value in joining, not just a private admin tool. Note: the long-term answer may be a move to Next.js for proper SSR (current stack is a Vite SPA, which caps what's achievable for crawlability); that migration is out of scope now — Phase 2 scope is whatever's achievable within the current architecture (meta tags, sitemap, robots.txt, structured data, etc.), with the Next.js question revisited later as a possible architectural decision ✓ — server-rendered story content (not just metadata) shipped across home/gallery/work/about/commission/events/classes; see `docs/wip/gallery-discoverability.md` and CLAUDE.md Current State
- **Classes page enhancements** — brought Classes up to parity with Commission's richer intro: configurable body paragraphs below the heading (`classesBody`, mirrors `commissionBody`), and the single static header image replaced by a reorderable slideshow (context `"classes"`, same infra as Landing/Commission) ✓
- **Testimonials** — reusable `Testimonial` model + `TestimonialsEditor`/`TestimonialsSection` components, keyed by `context`; shipped on both Classes and Commission (rendered inside each page's existing header/intro card, below the paragraphs/slideshow); moved up from the Parking Lot once real content existed to review (see Gallery discoverability above) ✓
- **Works in Progress + Digital Library** — an artist can start a work before it's finished (progress photos, no title/price required yet), with an optional Home-page section showing active in-progress pieces to visitors; plus a reusable, gallery-wide reference-photo library (`DigitalAsset`/`AssetLinkage` schema, deliberately extensible to future link types beyond works). Built and shipped 2026-08-10 at Karl's explicit request, ahead of the normal Phase 3 "only if early adopters ask" process — Melody asked directly and Karl judged it a good pre-outreach differentiator. Supersedes the "Reference photo library" Phase 3 candidate below (removed from that list — the shipped version is materially larger in scope, an asset+linkage architecture rather than a standalone photo manager). Bundled fix: `/api/works` was missing admin auth and gallery scoping on its write routes, found and fixed in the same branch. See CLAUDE.md Current State and `docs/wip/works-in-progress-digital-library.md` for full detail ✓


---

## Phase 3 — Early Adopter Engagement
*Onboard 3–5 artists. Observe. React.*

- **Observe usage patterns** — watch what early adopters actually use, what they ignore, what they ask for
- **React to feedback** — build what they specifically request; do not build speculatively
- **Candidates for Phase 3 build** (only if early adopters ask):
  - Classes registration/booking (the simple offering-list version — label/heading/description/inquiry — already shipped in Phase 2; this candidate is booking/scheduling on top of it)
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

- **Public AI visitor chat** — descoped from Phase 2. Original concept: per-gallery Claude-powered chat widget on the public site, answering visitor questions from the gallery's own data. Shelved after early adopter feedback (Melody): high-end art gallery visitor interactions need to be personal, not AI-mediated. Revisit only if a future early adopter specifically wants it — likely as an opt-in per gallery, not a default.
- **Higher-level AI admin agent** — expand the current admin assistant (app-only knowledge, no actions) into one that knows the specific gallery's own data/config and can take actions on the owner's behalf; longer-term, extend into AI support for administration, marketing, and promotion. Likely higher value-add than the public visitor chat, but not an immediate build — no early adopter has asked for it yet.
- **AI gallery review** — AI-generated review/analysis of how well each gallery's public content tells a compelling "story" (bio, artist statement, work descriptions) for the answer-engine era of search, where AI search surfaces narrative over metadata; first piece of the broader marketing/promotion assistance vision. Prerequisite: the gallery's story content has to actually be visible/parseable to AI crawlers first — depends on dynamic rendering (see Gallery discoverability, Phase 2) landing before this has anything to analyze.
- **Work sharing — dedicated single-work page** — richer version beyond the Phase 2 deep-link share button: a distraction-free single-work URL (no nav, rich metadata — title, image, price, artist statement excerpt) rather than the gallery page with a modal open. Revisit if early adopters want something more polished than the deep-link version.
- **Style sheet token updates** — periodic refresh of the design system CSS variable sets (color palettes, font pairings) as the platform matures and more gallery types onboard; update `docs/SITE_DESIGN.md` when scoped
- **Invoice viewer for paid invoices** — currently a paid invoice URL just shows "Payment received" banner with no invoice details; collector may need to reference what they paid for; also, People management has no invoice history — should show all orders/invoices linked to a person with status and amounts
- **Painting card access from inquiry** — painting inquiries reference a specific work; admin should be able to pull up the painting detail card directly from the inquiry without navigating away; part of the broader inquiry flow discussion (may move to post-Phase 3 along with full inquiry workflow)
- **In-platform customer conversation** — fully functional inquiry conversation management without leaving the app; reply to collectors, track thread history, mark resolved; currently the platform captures inquiries but responses require switching to external email; may integrate with Resend two-way email or build an in-app messaging layer; key differentiator for gallery owners who want a single workspace for sales and communication
- **newsletter authoring and management** — currently the newsletter has only a subscriber list.  add capability to create newsletters, maintain newsletter history, send to subscribers, manage subscriber list, newsletter conversations.
- **Anthropic API usage tracking** — store input/output token counts per support chat message; show monthly cost summary per gallery in app admin Support Logs; useful for understanding per-gallery AI cost as scale grows
- **NS verification status** — poll/check whether client has switched nameservers; show status in app admin gallery detail (pending / propagating / live)
- **Commission/inbox polish** — tighten the inquiry → invoice → payment workflow so it feels solid end-to-end
- **Free-form custom pages** — artist can create one or more custom nav pages (title, nav label, rich-text content, optional hero image); covers Music, Classes landing, and any other artist-specific need; replaces the need for one-off page types
- **Blog** — minimal: posts with title, content, date, published toggle; admin management tab
- **Subscription-tier feature gating** — every Site Features toggle (commissions, newsletter, events, music, classes, blog, works in progress, reference library, …) is currently available to every gallery regardless of plan; there's no concept yet of which features a given subscription tier includes, and no billing tie-in. Karl flagged this as the next priority after Works in Progress (2026-08-10) — needs an accurate record of what's shipped (CLAUDE.md Current State) and what's parked (this list) to design tier boundaries against.

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
| AI approach | AI-native for internal/operator and gallery-owner tooling; NOT for public-facing visitor interaction (high-end gallery visitors expect personal, not AI-mediated, engagement — see Parking Lot) | Phase 2+ |
| Watermark source | `siteTitle` from SiteConfig, read at upload time | code |
| Image storage | Cloudflare R2, originals immutable | `docs/ARCHITECTURE.md` |
| Auth | In-memory access token + HttpOnly refresh cookie | `docs/ARCHITECTURE.md` |
| Staging DB | Separate DB + seed script; prod copy only with scrub | `docs/wip/staging-environment.md` |
