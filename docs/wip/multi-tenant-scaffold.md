# Multi-Tenant Scaffold

**Status:** Planned — next major priority before onboarding additional gallery clients.

---

## Goal

Introduce a `Gallery` model as the top-level tenant. Every piece of data — config, paintings, people, orders, slideshows — belongs to a gallery. A single Railway deployment serves all galleries.

---

## Schema Changes

### New model
```prisma
model Gallery {
  id           String    @id @default(cuid())
  slug         String    @unique           // used in routing: /g/:slug or subdomain
  name         String
  customDomain String?   @unique @map("custom_domain")  // e.g. melodydebenedictis.com
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  config       SiteConfig?
  paintings    Painting[]
  persons      Person[]
  socialLinks  SocialLink[]
  slides       SlideshowSlide[]
  spotlights   Spotlight[]
  orders       Order[]
  contacts     ContactMessage[]
  commissions  CommissionRequest[]

  @@map("gallery")
}
```

### Models that gain `galleryId`
Every model gets `galleryId String @map("gallery_id")` + relation to Gallery.
Priority order (least disruptive first):
1. `SiteConfig` — remove singleton `@id @default("singleton")`, add `galleryId @unique`
2. `SocialLink`, `SlideshowSlide` — clean new tables, easy migration
3. `Painting`, `Spotlight`, `PrintProduct`
4. `Person`, `RefreshToken`
5. `Order`, `OrderItem`, `CommissionRequest`, `ContactMessage`, `NewsletterSubscriber`
6. `DailyAnalytics` — add `galleryId`; Cloudflare zone ID becomes per-gallery config field

### Person.isAppAdmin
Add `isAppAdmin Boolean @default(false) @map("is_app_admin")` to `Person`.
App admins can act across all galleries; gallery admins are scoped to one.

---

## Auth Changes

### JWT payload
```typescript
// current
{ personId: string, isAdmin: boolean }

// new
{ personId: string, galleryId: string, isAdmin: boolean, isAppAdmin: boolean }
```

### Middleware
- `requireAdmin` → checks `person.isAdmin && person.galleryId === jwt.galleryId`
- `requireAppAdmin` → checks `person.isAppAdmin` (no gallery scope)
- Gallery resolved from: custom domain lookup → `Gallery.customDomain`, fallback to slug

### Gallery resolution (request middleware)
```
incoming request
  → check Host header against Gallery.customDomain
  → if no match, check slug from path prefix or subdomain
  → attach req.gallery to all routes
  → 404 if gallery not found or inactive
```

---

## Route Changes

All routes gain gallery scope via `req.gallery.id`. No URL changes visible to end users — gallery is resolved from the domain/subdomain, transparent to clients.

Public routes: paintings, config, slides, contact, commission — all filtered by `galleryId`.
Admin routes: all require JWT `galleryId` to match the request gallery.

---

## Migration Strategy

1. Create `Gallery` table
2. Insert one row: `{ slug: 'melody', name: 'Melody DeBenedictis', customDomain: 'melodydebenedictis.com' }`
3. Add nullable `gallery_id` to all tables
4. Backfill: `UPDATE painting SET gallery_id = (SELECT id FROM gallery WHERE slug = 'melody')`
5. Add NOT NULL constraint + FK
6. Change `site_config` primary key from `"singleton"` to cuid, add `gallery_id @unique`

Migration must run in Prisma steps to avoid constraint violations during backfill.

---

## Hosting Model (Railway)

- One Railway service per environment (not per gallery)
- `customDomain` in the `Gallery` table maps artist domains to their gallery record
- Railway custom domains: each artist's domain points to the same Railway service
- Gallery resolved at request time from the `Host` header

---

## Open Questions

- [ ] Self-service gallery provisioning via app admin, or Karl provisions manually for now?
- [ ] Subdomain routing (gallery.melodyapp.com) vs. custom domain only?
- [ ] Billing model — how is per-gallery billing tracked?
