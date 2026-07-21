# Staging Environment

**Status:** Planned. Can be provisioned in Railway at any time — schema and process designed here.

---

## Architecture

```
GitHub: main branch
  ├── → Railway staging environment  (auto-deploy on push to main)
  └── → Railway production environment (auto-deploy on push to main, or manual promote)

Separate PostgreSQL instances:
  staging-db   ← clean schema + seed data
  production-db ← real data
```

---

## Railway Setup Steps

1. In Railway project: **New Environment** → name it "staging"
2. Add PostgreSQL plugin to staging environment → copy the `DATABASE_URL`
3. Duplicate production service vars into staging, replacing:
   - `DATABASE_URL` → staging DB URL
   - `R2_BUCKET` → a separate R2 bucket (`mdfine-staging`) or same bucket with key prefix
   - `SQUARE_ENV=sandbox` (when Square is added)
   - `RESEND_*` → use Resend test mode or a dev inbox
   - Any other secrets that shouldn't hit prod systems
4. Connect staging environment to the same GitHub repo / branch

**Deploy flow:**
- Push to `main` → auto-deploys to staging
- After staging QA passes → manually promote to production (Railway "Promote" button) or auto-deploy production from same branch

---

## Staging Database Setup

On first provision (run once):

```bash
# Point at staging DB
DATABASE_URL=<staging-url> npx prisma migrate deploy

# Run seed script
DATABASE_URL=<staging-url> npx ts-node server/src/scripts/seed-staging.ts
```

### Seed script (`server/src/scripts/seed-staging.ts`)
Creates representative test data — not a prod copy:

```typescript
// Creates:
// - 1 gallery: { slug: 'staging-demo', name: 'Demo Gallery' }
// - 1 admin user: dev@example.com / password: changeme
// - 1 app admin: karl@example.com / password: changeme
// - 10 sample paintings (no real images — placeholder R2 paths or small test images)
// - SiteConfig with sensible defaults
// - A few contact messages and commission requests
```

---

## Production → Staging Copy (for realistic testing)

Use only when you need prod-scale data to test a migration or performance issue.
**Never copy prod to staging routinely** — it normalizes moving real data unnecessarily.

```bash
# 1. Dump production (Railway exec or local pg_dump with tunnel)
pg_dump $PROD_DATABASE_URL > prod-snapshot.sql

# 2. Restore to staging
psql $STAGING_DATABASE_URL < prod-snapshot.sql

# 3. Scrub PII (run immediately after restore)
psql $STAGING_DATABASE_URL < server/scripts/scrub-staging.sql
```

### `server/scripts/scrub-staging.sql`
Write this script BEFORE adding Square/payment data:

```sql
-- Anonymize persons
UPDATE person
SET email = 'dev+' || id || '@example.com',
    name  = 'Test User ' || row_number() OVER (),
    phone = NULL,
    password_hash = NULL;  -- force password reset on staging

-- Anonymize contact messages
UPDATE contact_message
SET email = 'dev@example.com', name = 'Test', phone = NULL;

-- Anonymize commission requests
UPDATE commission_request
SET email = 'dev@example.com', name = 'Test', phone = NULL;

-- When Square is added: nullify all Square tokens and customer IDs
-- UPDATE person SET square_customer_id = NULL;
-- UPDATE "order" SET square_invoice_id = NULL, square_order_id = NULL;

-- Recreate a known admin for staging use
UPDATE person SET password_hash = '<bcrypt of "changeme">'
WHERE email LIKE 'dev+%@example.com'
LIMIT 1;
```

---

## Pre-Deploy Checklist (production)

Before promoting staging → production:

- [ ] `prisma migrate status` clean on staging
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] New config features tested with real data (hero image upload, slideshow reorder)
- [ ] Auth flow works (login, refresh, logout)
- [ ] Public pages load without error (home, gallery, commission, about)
- [ ] Admin pages load and save correctly
- [ ] R2 uploads work end-to-end

---

## R2 Staging Bucket

Options:
1. **Separate bucket** (`mdfine-staging`) — cleanest isolation; staging uploads never appear in prod
2. **Same bucket, key prefix** (`staging/paintings/...`) — simpler setup, lower cost, slightly messier

Recommendation: separate bucket while in early development; consolidate later if cost matters.

---

## Square Sandbox (when Square integration lands)

- Staging uses Square sandbox credentials (no real charges)
- Env var: `SQUARE_ENVIRONMENT=sandbox`
- Separate Square sandbox account or same account with sandbox mode
- Webhook endpoint: Railway provides a public URL per environment — configure separately in Square dashboard

---

## When to Provision

Can be done any time. Logical triggers:
- Before starting multi-tenant scaffold (test migrations safely)
- Before adding Square (never want payment code running untested in prod)
- Before approaching early adopter clients (show them you have a safe deploy process)
