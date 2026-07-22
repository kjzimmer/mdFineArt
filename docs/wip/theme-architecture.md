# Theme Architecture — Multi-Design Support

**Status:** Deferred to Phase 6. Design decision made; no implementation yet.

The question: how to offer artists meaningfully different site designs (not just color/font variations), without maintaining N separate codebases.

---

## Decision: Shell + Theme Packages

**Not** multiple frontend repos. **Not** everything in one repo with a flags system.

The right split:

```
Platform Shell (one repo, one deploy per environment)
  - Routing, auth, API calls, admin panel
  - Data fetching, SiteConfig context
  - Theme loader

  Loads at startup based on SiteConfig.themeId:
  ├── @gallery/theme-classic   (own repo, own npm package)
  ├── @gallery/theme-minimal   (own repo)
  └── @gallery/theme-editorial (own repo)
              │
              ▼
        Shared backend API (never changes per theme)
```

The backend is already API-first and never needs to know which theme a gallery uses.

The admin panel lives **only in the shell** — identical for every gallery regardless of public theme.

---

## Theme Interface

Every theme is a private npm package that exports components matching this contract:

```typescript
// Defined in the shell; implemented by each theme package
export interface GalleryTheme {
  Layout:         React.ComponentType<LayoutProps>
  HeroSection:    React.ComponentType<HeroProps>
  GalleryGrid:    React.ComponentType<GalleryGridProps>
  PaintingCard:   React.ComponentType<PaintingCardProps>
  PaintingDetail: React.ComponentType<PaintingDetailProps>
  CommissionPage: React.ComponentType<CommissionProps>
  AboutPage:      React.ComponentType<AboutProps>
  ContactPage:    React.ComponentType<ContactProps>
}

// Props passed to theme components by the shell
export interface HeroProps {
  config: SiteConfig
  slides: Slide[]
}
export interface GalleryGridProps {
  paintings: Painting[]
  config: SiteConfig
}
// etc.
```

Themes receive typed data from the shell and render it however they like. No API calls inside themes.

---

## What Each Theme Repo Contains

- Presentational React components implementing `GalleryTheme`
- Its own Tailwind config or CSS (completely independent design tokens)
- Its own fonts, animations, layout decisions
- `package.json` with the shell's `GalleryTheme` interface as a peer dependency

## What Each Theme Repo Does NOT Contain

- API calls (never)
- Auth logic (never)
- Admin panel components (never)
- Routing (the shell owns this)

---

## Build-Time vs. Runtime Theme Loading

**Phase 6 implementation: build-time (simpler)**
- Each gallery's deployment bakes in its selected theme at build time
- Changing theme = redeploy (Railway webhook can automate this)
- No complex bundle splitting needed

**Future option: runtime dynamic imports**
- `React.lazy(() => import(themeId))` loads theme on first request
- True no-redeploy theme switching
- Requires careful code-splitting in the Vite config
- Worth it when theme-switching becomes a self-service feature

---

## What to Do Now to Prepare

No implementation needed. But keep these patterns clean so the refactor is cheap later:

1. **Page components should not fetch their own data** — keep fetching at route level, pass data as props. Theme components must be pure functions of props.
2. **`useSiteConfig()` is already the right pattern** — themes just consume it.
3. **Define prop types clearly** — the `PaintingCard` props, `HeroProps`, etc. are already partially typed. The theme interface formalizes what's already implicit.

---

## Phase 4 vs. Phase 6 Distinction

**Phase 4 (Styling Options):** CSS variable sets, font pairings, minor layout variants — all within the current single design. Implemented as `SiteConfig.themeId` mapping to a CSS variable override block. No new repos.

**Phase 6 (Theme Architecture):** Genuinely different layouts and visual languages — a minimalist text-forward design vs. a bold image-first design. Requires the shell + package architecture described here.

Approach early adopters with Phase 4. Build Phase 6 when artists tell you CSS variable variations aren't enough.

---

## Comparison to Industry Patterns

| Platform | Theme model |
|----------|------------|
| Shopify | Liquid templates; theme files stored in DB, rendered server-side |
| Ghost | Handlebars theme API; themes implement a spec; installed per site |
| WordPress | PHP themes; extreme freedom, extreme inconsistency |
| **This platform (Phase 6)** | React component packages; typed interface; shell + packages |

The Ghost model is the closest analogue and the right inspiration.
