-- Collapse SiteConfig.siteTitle into Gallery.name (single source of truth for gallery name).
-- Preserve any custom siteTitle values by syncing them to gallery.name before dropping.
UPDATE "gallery" g
SET "name" = sc."site_title"
FROM "SiteConfig" sc
WHERE sc."gallery_id" = g.id
  AND sc."site_title" IS NOT NULL
  AND sc."site_title" != '';

ALTER TABLE "SiteConfig" DROP COLUMN IF EXISTS "site_title";
