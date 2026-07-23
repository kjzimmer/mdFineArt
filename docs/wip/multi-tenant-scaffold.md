# Multi-Tenant Scaffold

**Status:** In progress — Phase A (schema + migration) is next.

---

## Goal

Introduce a `Gallery` model as the top-level tenant. Every piece of data — config, paintings, people, orders, slideshows — belongs to a gallery. A single Railway deployment serves all galleries.

---

## Schema Changes

### New: Gallery model
```prisma
model Gallery {
  id           String    @id @default(cuid())
  slug         String    @unique
  name         String
  customDomain String?   @unique @map("custom_domain")
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  config       SiteConfig?
  paintings    Painting[]
  memberships  GalleryMembership[]
  socialLinks  SocialLink[]
  slides       SlideshowSlide[]
  spotlights   Spotlight[]
  orders       Order[]
  contacts     ContactMessage[]
  commissions  CommissionRequest[]

  @@map("gallery")
}
```

### New: GalleryMembership junction table
Replaces `Person.isAdmin`. Supports multiple admins per gallery and one person
being admin on multiple galleries with the same Person record.

```prisma
model GalleryMembership {
  id        String   @id @default(cuid())
  personId  String   @map("person_id")
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  galleryId String   @map("gallery_id")
  gallery   Gallery  @relation(fields: [galleryId], references: [id], onDelete: Cascade)
  isAdmin   Boolean  @default(false) @map("is_admin")
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([personId, galleryId])
  @@map("gallery_membership")
}
```

`Person.isAdmin` is removed. `Person.isAppAdmin` is added for cross-gallery
super-admin access. Gallery admins are authorized via `GalleryMembership`;
app admins via `Person.isAppAdmin`.

### Person changes
- Remove `isAdmin Boolean`
- Add `isAppAdmin Boolean @default(false) @map("is_app_admin")`
- Add `memberships GalleryMembership[]` relation
- Person records are NOT gallery-scoped — they are global, identified by email.
  A Person is associated with galleries through GalleryMembership.

### Models that gain `galleryId`
Every model gets `galleryId String @map("gallery_id")` + relation to Gallery.
Priority order (least disruptive first):
1. `SiteConfig` — remove singleton `@id @default("singleton")`, add `galleryId @unique`
2. `SocialLink`, `SlideshowSlide` — clean tables, easy migration
3. `Painting`, `Spotlight`, `PrintProduct`
4. `RefreshToken` — stays on Person (Person is global); no galleryId needed
5. `Order`, `OrderItem`, `CommissionRequest`, `ContactMessage`, `NewsletterSubscriber`
6. `DailyAnalytics` — add `galleryId`; Cloudflare zone ID becomes per-gallery config field

---

## Auth Changes

### JWT payload
```typescript
// current
{ personId: string, isAdmin: boolean }

// new
{ personId: string, galleryId: string, isAdmin: boolean, isAppAdmin: boolean }
```

`isAdmin` in the JWT reflects the person's GalleryMembership.isAdmin for the
gallery this session is scoped to.

### Login flow
1. Verify password → resolve Person
2. Look up GalleryMembership records for this person + the request gallery
3. If membership exists: issue JWT with `galleryId` + `isAdmin` from membership
4. If `isAppAdmin`: issue JWT with gallery scope of the request gallery, `isAdmin: true`
5. If person has memberships in multiple galleries and hits an app-admin login page:
   show a gallery picker before issuing the scoped JWT (future; not needed for MVP)

### Middleware
- `requireAdmin` → checks JWT `isAdmin === true && jwt.galleryId === req.gallery.id`
- `requireAppAdmin` → checks `person.isAppAdmin` (no gallery scope)
- Gallery resolved from Host header → `Gallery.customDomain` lookup

### Gallery resolution (request middleware)
```
incoming request
  → check Host header against Gallery.customDomain
  → if no match, 404 (no subdomain routing for now)
  → attach req.gallery to all routes
  → 404 if gallery not found or inactive
```

---

## Route Changes

All routes gain gallery scope via `req.gallery.id`. No URL changes visible to
end users — gallery is resolved from the domain, transparent to clients.

Public routes: paintings, config, slides, contact, commission — all filtered by `galleryId`.
Admin routes: all require JWT `galleryId` to match `req.gallery.id`.

---

## Migration Strategy

Must run as multiple Prisma migrations to avoid constraint violations during backfill.

**Step 1 — Add Gallery + GalleryMembership, update Person**
- Create `Gallery` table
- Create `GalleryMembership` table
- Add `isAppAdmin` to Person; remove `isAdmin` from Person (after backfill in Step 3)

**Step 2 — Seed Melody's gallery**
- Insert Gallery: `{ slug: 'melody', name: 'Melody DeBenedictis', customDomain: 'melodydebenedictis.com' }`
- Insert GalleryMembership for existing admin Person(s) with `isAdmin: true`

**Step 3 — Add nullable galleryId columns + backfill**
- Add nullable `gallery_id` to all scoped tables
- Backfill all rows: `UPDATE <table> SET gallery_id = (SELECT id FROM gallery WHERE slug = 'melody')`

**Step 4 — Add NOT NULL + FK constraints**
- Separate migration after backfill is confirmed

**Step 5 — SiteConfig primary key change**
- Change from `@id @default("singleton")` to cuid, add `galleryId @unique`
- Most complex step; requires careful migration SQL

---

## Hosting Model (Railway)

- One Railway service per environment (not per gallery)
- `customDomain` in the `Gallery` table maps artist domains to their gallery record
- Railway custom domains: each artist's domain points to the same Railway service
- Gallery resolved at request time from the `Host` header

---

## App Admin UI

Separate from gallery admin. Visible only to `isAppAdmin` users. Covers:
- Provision a new gallery (create Gallery record + first GalleryMembership)
- Add/remove gallery members and set isAdmin
- Activate/deactivate galleries
- View all galleries + basic stats

Provisioning is manual (Karl does it) — no self-service signup for now.

---

## Open Questions

- [x] Multiple admins per gallery → yes, via GalleryMembership
- [x] One person, multiple galleries → yes, via GalleryMembership
- [x] Subdomain routing → deferred; custom domain only for now
- [ ] Self-service gallery provisioning → Karl provisions manually; automate later
- [ ] Billing model — how is per-gallery billing tracked?
