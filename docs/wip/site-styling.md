# Site Styling — CSS Token Themes

## Goal
Replace all hardcoded design values with CSS custom properties so the active theme
can be switched by changing a single `data-theme` attribute on `<html>`. Phase 2
delivers 4 canned themes; later phases add AI-assisted and fully custom styling.

## Token Vocabulary

### Colors (stored as RGB channels — enables Tailwind opacity modifiers)
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

### Typography
```
--font-display           heading / painting title font
--font-body              UI / body copy font
--tracking-display       letter-spacing for display headings
```

### Shape
```
--radius-sm              small elements (badges, pills)
--radius-md              default cards, inputs
--radius-lg              large cards
--radius-hero            hero/slideshow card (currently 2rem)
--radius-card            alias used by most cards (= --radius-md per theme)
--radius-pill            full pill (9999px, always)
```

### Depth & Motion
```
--shadow-soft            large ambient shadow (hero card)
--shadow-card            standard card elevation
--gradient-bg            body background gradient
--duration-fast          fast transitions (buttons, hovers)
--duration-base          standard transitions
```

## Tailwind Integration
Colors mapped as `rgb(var(--color-NAME) / <alpha-value>)` — this preserves all
existing `/60`, `/70`, `/90` opacity modifier usage (~300 instances).

```js
// tailwind.config.js
colors: {
  bg:               'rgb(var(--color-bg) / <alpha-value>)',
  surface:          'rgb(var(--color-surface) / <alpha-value>)',
  'surface-overlay':'rgb(var(--color-surface-overlay) / <alpha-value>)',
  'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
  border:           'rgb(var(--color-border) / <alpha-value>)',
  text:             'rgb(var(--color-text) / <alpha-value>)',
  muted:            'rgb(var(--color-muted) / <alpha-value>)',
  accent:           'rgb(var(--color-accent) / <alpha-value>)',
  accentHover:      'rgb(var(--color-accent-hover) / <alpha-value>)',
  sold:             'rgb(var(--color-sold) / <alpha-value>)',
  success:          'rgb(var(--color-success) / <alpha-value>)',
}
```

Radius and shadow mapped so `rounded-hero`, `rounded-card`, `shadow-soft`, `shadow-card`
classes pull from tokens.

## Themes

| ID | Name | Feel |
|----|------|------|
| `dark-western` | Dark Western (default) | Warm dark earth tones, burnt sienna accent, Cormorant + Inter |
| `light-linen` | Light Linen | Warm cream bg, terra cotta accent, Playfair Display + Lato |
| `modern-slate` | Modern Slate | Cool white, navy accent, DM Serif Display + DM Sans, sharp corners |
| `forest-night` | Forest Night | Deep forest green bg, sage accent, Libre Baskerville + Source Sans |

## DB Storage
`SiteConfig.theme String? @map("theme_id")` — nullable; null = dark-western default.
Applied at page load by reading `config.theme` and setting
`document.documentElement.dataset.theme = config.theme ?? 'dark-western'`.

## Arbitrary Values Converted
6 files had hardcoded colors not covered by original Tailwind config:
- `PaintingCard.tsx` — `bg-[#1f1b17]` → `bg-surface-raised`
- `HeroSlideshow.tsx` — `bg-[#181513]/90` → `bg-surface-overlay/90`
- `SlideshowDisplay.tsx` — `bg-[#181513]/90` → `bg-surface-overlay/90`
- `About.tsx` — `bg-[#181513]/90` → `bg-surface-overlay/90`
- `Classes.tsx` — `bg-[#181513]/90` → `bg-surface-overlay/90`
- `Home.tsx` — `bg-[#16120f]/90` → `bg-surface-overlay/90`

Also: `rounded-[2rem]` → `rounded-hero` in About.tsx, Classes.tsx, Home.tsx.

## Font Loading
All theme fonts loaded eagerly in index.html (4 display + 4 body = 8 families).
Dynamic font injection deferred to Phase 3+ AI designer.
