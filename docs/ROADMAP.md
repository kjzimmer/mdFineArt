# Product Roadmap

This is the agreed phasing for evolving mdFineArt from a single-artist site into a gallery SaaS platform. Read this before starting any new major feature to understand where it fits.

**Target:** 3–5 early adopter artists to validate the platform before broader marketing.

---

## Phase 1 — Multi-Tenant Foundation
*Do this before approaching any prospective clients.*

- **Multi-tenant scaffold** — `Gallery` model, `galleryId` FKs on all tables, gallery-scoped auth JWT
- **App admin (basic)** — provision galleries, assign gallery admins, `isAppAdmin` flag
- **Staging environment** — Railway staging env, seed script, scrub script, deploy process
- **Gallery admin config (About page)** — highest-value gap; artists need bio, statement, portrait, shows

Why first: nothing else scales without it. Every feature built after this costs less because tenant scope is already in place.

---

## Phase 2 — Commerce
*Can begin in parallel with late Phase 1.*

- **Square integration** — per-gallery Square location ID, payment flow for originals and prints
- **Order management improvements** — payment status, receipt flow
- **Print product configuration** — per-gallery print SKUs via Square catalog

Why second: artists sell things. Without payment processing, the platform's commercial value is limited.

---

## Phase 3 — Early Adopter Pitch
*Approach 3–5 artists after Phase 2 is complete.*

At this point the platform has: multi-tenant, commerce, solid config, clean admin, analytics. Onboard manually via app admin. Collect real feedback before building styling or AI features. Do not approach earlier.

---

## Phase 4 — Styling Options
*Build after hearing from real artists about what they actually want.*

- **Color palette selection** — 3–4 curated themes as CSS variable sets
- **Font pairing options** — 2–3 pairings per theme
- **Layout variants** — minor layout options (hero style, card shape, grid density)

This is CSS-variable-level customization within one design system — not separate site designs. See `docs/wip/theme-architecture.md` for the full multi-design approach planned for later.

---

## Phase 5 — Growth Features
*Ongoing, driven by early adopter feedback.*

- **AI customer support** — per-gallery knowledge base; Claude API; instant answers for gallery owners and visitors
- **Blog and Events** — full admin tabs (stubs exist, currently deferred)
- **Resend email** — replace Formspree; per-gallery notification settings
- **Newsletter improvements** — campaigns, segments

---

## Phase 6 — Integrations
*Future. Timed to when the accounting app and payment complexity justify it.*

- **Accounting system integration** — separate app being built; API bridge TBD
- **Square advanced** — subscriptions, recurring billing for platform fees
- **Visitor tracking beacon** — spec at `docs/VISITOR_TRACKING_SPEC.md`
- **Multi-design theme system** — shell + theme packages; see `docs/wip/theme-architecture.md`

---

## Deferred Indefinitely

- Forced logout all sessions — defer until multi-tenant SaaS with support staff (see memory)
- Self-service gallery signup — Karl provisions manually for now; automate when volume warrants

---

## Key Architectural Decisions Already Made

| Decision | Choice | Doc |
|----------|--------|-----|
| Multi-tenancy model | Gallery model + galleryId FKs, host-header resolution | `wip/multi-tenant-scaffold.md` |
| Theme system (future) | Shell + theme npm packages; not separate frontends | `wip/theme-architecture.md` |
| Watermark source | `siteTitle` from SiteConfig, read at upload time | code |
| Image storage | Cloudflare R2, originals immutable | `ARCHITECTURE.md` |
| Auth | In-memory access token + HttpOnly refresh cookie | `ARCHITECTURE.md` |
| Staging DB | Separate DB + seed script; prod copy only with scrub | `wip/staging-environment.md` |
