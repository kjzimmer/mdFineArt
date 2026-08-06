# SITE_DESIGN.md — myGalleryWorks.com Platform

> This file covers the design *system* (tokens, themes, page-by-page conventions) — not the
> content of any one gallery, which is entirely admin-configured (see `docs/ARCHITECTURE.md`
> "Database Schema" for `SiteConfig`). Update freely as the design system evolves; per
> CLAUDE.md, do not restyle or restructure components without consulting this doc first.

*Rewritten 2026-08-03 — the previous version predated the theme system entirely and described
one hardcoded palette (Melody's) as if it were the whole platform's design; it also described
page content as fixed text, and a `/gallery/:slug` print-purchase detail page that doesn't
match either what shipped (a deep-linked modal) or CLAUDE.md's note that cart/checkout is
deferred to Phase 5.*

---

## Theme System

Visual identity is entirely CSS custom properties, swapped by setting
`document.documentElement.dataset.theme` from `SiteConfig.theme` (`null` = `dark-western`
default). No separate stylesheets or component variants — every themed value is a token.
Defined in `client/src/styles.css`, mapped into Tailwind via `tailwind.config.js`.

### Token Vocabulary

**Colors** (stored as space-separated RGB channels, no `rgb()` wrapper — enables Tailwind's
`/60` `/70` `/90` opacity modifiers, used ~300 times across the app):
```
--color-bg               main page background
--color-surface          card / panel background
--color-surface-overlay  semi-transparent overlay panels (captions, newsletter card)
--color-surface-raised   slightly lifted surface (image placeholder, hover state)
--color-border           subtle dividers
--color-text             primary body text
--color-muted            secondary / caption text
--color-accent           CTA buttons, highlights, active states
--color-accent-hover     accent hover state
--color-sold             SOLD badge
--color-success          success indicators
```

**Typography**
```
--font-display           heading / work title font
--font-body               UI / body copy font
--tracking-display        letter-spacing for display headings
```

**Shape**
```
--radius-sm / -md / -lg   badges/pills, default cards+inputs, large cards
--radius-hero              hero/slideshow card
--radius-section            page section cards
--radius-card               alias most cards resolve to (= --radius-md per theme, themeable independently)
--radius-pill               nav/filter pills
```

**Depth & Motion**
```
--shadow-soft / --shadow-card
--duration-fast / --duration-base
```

Tailwind mapping (`tailwind.config.js`): `bg`, `surface`, `surface-overlay`, `surface-raised`,
`border`, `text`, `muted`, `accent`, `accentHover`, `sold`, `success` as colors;
`font-display`/`font-body`; `rounded-hero`/`rounded-card`/`rounded-section`;
`shadow-soft`/`shadow-card`.

### Live Themes (`client/src/styles.css`)

| ID | Name | Feel |
|---|---|---|
| *(default, `:root`)* | Dark Western | Warm near-black, burnt sienna accent, Cormorant Garamond + Inter, soft rounded shapes |
| `prairie-gold` | Prairie Gold | Warm dark western/traditional-oil variant, Fraunces + Inter, tighter radii |
| `white-cube` | White Cube | Stark white, sharp navy-blue accent, Archivo Black + Inter, zero radius, no shadows — contemporary/abstract |
| `morning-wash` | Morning Wash | Warm cream, sage-teal accent, EB Garamond + Work Sans, generous radii — watercolor/plein air |
| `studio-precision` | Studio Precision | Near-black, darkroom-red accent, Barlow Condensed + Barlow, zero radius, no shadows — fine art photography |
| `raw-material` | Raw Material | Warm stone/concrete tones, oxidized-copper accent, Roboto Slab + Roboto, near-zero radius — sculpture/mixed media |

`white-cube`, `morning-wash`, and `raw-material` set `color-scheme: light`; the rest are dark.
All 6 themes' fonts are loaded eagerly in `index.html` regardless of which is active — dynamic
per-theme font loading is a future optimization, not yet done.

---

## General UI Rules
- Minimal chrome; generous whitespace around artwork images
- No drop shadows on work images themselves — they float on the theme background
- Accent color used sparingly — buttons, hover states, price highlights, active nav/filter state
- `hover:text-accent` is the standard hover treatment across nav tabs, filter pills, gallery
  prev/next, footer links, inline text links

---

## Navigation

Top nav order (`TopNav.tsx`), each item gated by its own `SiteConfig` flag except About/Gallery
which are always shown: **About · Gallery · Events · Music · Classes · Blog · Commissions**.
Nav renders only the enabled sections — a gallery with everything off shows just About/Gallery.

---

## Pages

Every page below is driven by `SiteConfig` (via `SiteConfigContext`) — there is no
gallery-specific hardcoded content anywhere in these components. Empty/unconfigured sections
render nothing (or a friendly empty state), not placeholder text.

### Home (`/`)
Two-column hero (left 1.4fr) — `taglinePrimary`/`taglineSecondary`, "View Gallery" +
conditional "Commission" CTAs. Right column: DB-backed `HeroSlideshow` (context `"landing"`)
and, if `newsletterEnabled`, a signup card. Featured Works grid below, shown only if
`featuredEnabled` and at least one `Work.featured` exists.

### Gallery (`/gallery`, `/gallery/:slug`)
Uniform responsive grid (4/3/2 columns), featured-first then newest. Filter pills for subject
(if configured) and status. Clicking a card opens `Lightbox` as a modal over the grid — **not**
a separate detail page. `/gallery/:slug` deep-links directly to that modal open (see
`docs/wip/work-sharing.md`) via URL sync on open/close/navigate; visiting the URL directly
opens the modal on load. No cart or print-purchase flow in the lightbox — commerce is
dialog-first (inquire → admin creates invoice → Square payment link), not self-serve
cart/checkout (deferred to Phase 5, see `docs/ROADMAP.md`).

### About (`/about`)
Bio + artist statement sections (each with optional subtitle and side image), professional
memberships (logo or name/level), shows/awards/media/past-galleries lists — all from
`SiteConfig` JSON fields, all optional, all admin-editable in Configuration → About Page.

### Commission (`/commission`)
If `commissionsEnabled`: intro card with title + body paragraphs, optional slideshow (context
`"commission"`) in a two-column layout when slides exist, then `TestimonialsSection` (context
`"commission"`) rendered *inside that same card*, below the paragraphs/slideshow — not a
separate bordered section. Inquiry form card follows. If disabled: a "not currently accepting
commissions" message, not a hidden nav item with a broken route.

### Events (`/events`)
List-published-items-plus-inquiry pattern: date/time/venue/description/optional external
link/image, sorted upcoming-then-past.

### Classes (`/classes`)
Header card: label, heading, optional body paragraphs (`SiteConfig.classesBody`, same pattern
as Commission's body), optional slideshow (context `"classes"`, two-column layout when slides
exist), then `TestimonialsSection` (context `"classes"`) inside that same card below the
paragraphs/slideshow — same placement convention as Commission. Below the header card: offering
cards (label/heading/description) that open an inquiry modal pre-filled with that offering's
subject.

### Testimonials pattern (reusable)
`TestimonialsSection` (public) and `TestimonialsEditor` (admin) are shared components,
parameterized by a `context` string, currently used on Classes and Commission. Deliberately
**unwrapped** — no outer `rounded-section` border/shadow of its own — so it can sit inside an
existing page-section card as trailing content: a `border-t border-border pt-8 mt-10` divider,
small eyebrow label, then a `grid md:grid-cols-2` of `rounded-hero` cards (quote, author
name/detail, optional small round photo). Renders nothing when there are no published
testimonials for that context.

### Music (`/music`) / Blog (`/blog`)
"Coming Soon" stubs — `musicEnabled`/`blogEnabled` gate their nav visibility, but neither has
real content or (for Blog) a backend yet. Not included in the server-rendered SSR content or
sitemap for that reason — see `docs/wip/gallery-discoverability.md`.

### Contact (`/contact`)
Studio location + contact form. Note: this page's heading is currently hardcoded in
`Contact.tsx` rather than reading `SiteConfig.contactHeading`/`contactBody` — those fields are
actually consumed by a different, smaller contact card embedded in the About page. Known
inconsistency, not yet reconciled.
