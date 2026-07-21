# Gallery Admin Configuration — Remaining Items

**Status:** Planned. Foundation (SiteConfig, social links, hero image, slideshows, feature toggles) is live. This doc covers what remains.

---

## Already Live (do not re-implement)

- Gallery title, primary/secondary/footer taglines
- Hero background image (upload, replace, remove)
- Social links (URL-first, 13-platform auto-detection)
- Landing page slideshow
- Commission page slideshow + title/paragraphs
- Feature toggles: commissions, newsletter, events, featured works (+ count), show prices
- Collapsible config cards, auto-save on blur/toggle

---

## Remaining Config Items

### 1. About Page Content

Fields to add to `SiteConfig` (or a separate `AboutConfig` model if it grows large):

| Field | Type | Notes |
|-------|------|-------|
| `aboutName` | String? | Display name on about page (may differ from siteTitle) |
| `aboutBio` | String[]? | Array of paragraphs — same pattern as commissionBody |
| `artistStatement` | String? | Shorter statement, displayed separately |
| `profileImageUrl` | String? | Artist portrait — upload to R2 |
| `memberships` | String[]? | Professional orgs — e.g. "Oil Painters of America" |
| `shows` | JSON or child model | Title, venue, year, description |
| `recognitions` | String[]? | Awards, publications |

The About page currently has no admin control — all content is hardcoded. Decide: SiteConfig fields (simpler) vs. dedicated AboutSection model (more structured for shows/exhibitions).

### 2. Navigation

- Which pages appear in nav is already driven by feature flags (events, commissions)
- Consider: custom nav label overrides (e.g. rename "Classes" to "Workshops")
- Consider: page enable/disable for pages not yet feature-flagged (Music, Classes, Blog)

Add to SiteConfig:
```
musicEnabled Boolean @default(true)
classesEnabled Boolean @default(true)
blogEnabled Boolean @default(false)  // already deferred
```

### 3. Contact & Business Info

| Field | Type | Notes |
|-------|------|-------|
| `contactEmail` | String? | Public contact email displayed on site |
| `contactPhone` | String? | Optional public phone |
| `studioLocation` | String? | City/state shown on about or contact page |
| `timezone` | String? | For display of event times etc. |

### 4. SEO / Metadata

| Field | Type | Notes |
|-------|------|-------|
| `metaDescription` | String? | `<meta name="description">` — falls back to taglinePrimary |
| `ogImageUrl` | String? | Open Graph image for social sharing — falls back to heroImageUrl |

### 5. Email Notification Settings

Deferred until Resend integration (replaces Formspree). Fields:
- `notifyEmail` — where form submissions are forwarded
- `notifyOnContact Boolean`
- `notifyOnCommission Boolean`
- `notifyOnOrder Boolean`

### 6. Payment / Square Settings

Deferred to Square integration work. Fields needed:
- `squareLocationId` — per-gallery Square location
- `squareAccessToken` — stored encrypted, never in SiteConfig response payload

### 7. Styling / Theme

See separate `site-styling.md` when that work begins. Will be: color palette selection, font pairing, layout variant (hero style, card radius, etc.)

---

## Admin UI Structure (planned)

```
Configuration
├── Landing Page          [collapsible] ← live
│   ├── Titles & Taglines
│   ├── Hero Image
│   ├── Hero Slideshow
│   └── Social Links
├── About Page            [collapsible] ← planned
│   ├── Bio Paragraphs
│   ├── Artist Statement
│   ├── Profile Image
│   ├── Shows & Exhibitions
│   └── Memberships & Recognition
├── Navigation            [collapsible] ← partial (via feature flags)
├── Contact & Location    [collapsible] ← planned
├── SEO                   [collapsible] ← planned
├── Site Features         [collapsible] ← live
└── Notifications         [collapsible] ← deferred (Resend)
```

---

## Implementation Order

1. About page content (highest visible value for artist clients)
2. Nav page enable/disable
3. Contact & location info
4. SEO metadata
5. Notifications (with Resend integration)
6. Square per-gallery settings (with Square integration)
