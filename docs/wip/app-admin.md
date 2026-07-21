# App Admin Capability

**Status:** Planned. Depends on multi-tenant scaffold being complete first.

---

## What App Admin Is

A super-admin layer that sits above gallery admins. Karl (and any future support staff) can:
- View and manage all galleries
- Provision new gallery clients
- Assign/remove gallery admins
- View cross-gallery analytics
- Access any gallery's admin as if they were that gallery's admin (support/debugging)
- Manage billing records (future)

Gallery admins cannot see other galleries. App admins see everything.

---

## Auth Model

### `Person.isAppAdmin`
One flag added to the existing Person model. App admins log in the same way gallery admins do, but their JWT includes `isAppAdmin: true` and no `galleryId` restriction.

```typescript
// App admin JWT
{ personId: string, isAppAdmin: true, galleryId?: undefined }

// Gallery admin JWT
{ personId: string, isAdmin: true, galleryId: 'gallery-cuid' }
```

### `requireAppAdmin` middleware
```typescript
export function requireAppAdmin(req, res, next) {
  // verify JWT, check isAppAdmin === true
  // no gallery scope check
}
```

App admins can also pass a `X-Gallery-Id` header (or query param) to act within a specific gallery's context — enables "log in as this gallery's admin" without a separate login.

---

## App Admin UI

Separate route prefix: `/app-admin/` — completely distinct from `/admin/` (gallery admin).

Could be:
- A separate React route section within the same app (simplest for now)
- A separate deployment later if the surface area warrants it

### Sections

**Galleries**
- List all galleries (slug, name, domain, active, created date)
- Create gallery (slug, name, domain, assign initial admin user)
- Deactivate / reactivate gallery
- "Open as admin" — passes galleryId context to the normal admin shell

**Users**
- List all persons across all galleries (filtered by gallery)
- Create admin user for a specific gallery
- Promote/demote gallery admin
- Create app admin (own account only — never bulk)

**Cross-Gallery Analytics**
- Aggregate view: total galleries, active users, paintings, orders
- Per-gallery drill-down: revenue, submissions, analytics

**System Health**
- Migration status
- R2 usage (approximate — from upload counts)
- Recent errors (if error logging added)

---

## Provisioning Flow (manual, for now)

```
Karl creates gallery:
  POST /api/app-admin/galleries { slug, name, customDomain? }
    → creates Gallery record
    → creates SiteConfig for that gallery with defaults
    → returns galleryId

Karl creates admin user for gallery:
  POST /api/app-admin/galleries/:id/admins { name, email, password }
    → upserts Person with isAdmin + galleryId
    → sends login invite email (Resend)

Artist receives email → sets password → logs in at their domain
```

---

## Implementation Order

1. Complete multi-tenant scaffold first (app admin without tenant scoping is hollow)
2. Add `requireAppAdmin` middleware + basic gallery list endpoint
3. App admin gallery list + create gallery UI
4. App admin user management (assign gallery admins)
5. Cross-gallery analytics
6. "Open as gallery admin" impersonation

---

## Security Notes

- App admin credentials stored in same `Person` table with `isAppAdmin = true`; use a strong unique password, no shared credentials
- Impersonation ("open as") logs the action — audit trail even before a formal audit log feature
- Never expose `isAppAdmin` in public API responses
- Rate-limit app admin login endpoint separately (stricter: 3 attempts / 15 min)
