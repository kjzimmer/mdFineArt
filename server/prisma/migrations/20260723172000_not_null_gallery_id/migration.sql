-- Backfill any remaining null gallery_id rows before adding NOT NULL constraint.
-- This handles rows created by the old analytics/upload routes between the initial
-- backfill (seed-melody.ts) and this migration running on production.

UPDATE "Painting"             SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "PrintProduct"         SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "Spotlight"            SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "Order"                SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "ContactMessage"       SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "CommissionRequest"    SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "NewsletterSubscriber" SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "site_config"          SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "social_link"          SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "slideshow_slide"      SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;
UPDATE "daily_analytics"      SET "gallery_id" = (SELECT id FROM "gallery" WHERE slug = 'melody') WHERE "gallery_id" IS NULL;

-- Now safe to add NOT NULL constraints
ALTER TABLE "Painting"             ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "PrintProduct"         ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "Spotlight"            ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "Order"                ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "ContactMessage"       ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "CommissionRequest"    ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "site_config"          ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "social_link"          ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "slideshow_slide"      ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "daily_analytics"      ALTER COLUMN "gallery_id" SET NOT NULL;
