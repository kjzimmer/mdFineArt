-- Collapse gallery name into Gallery.name — single source of truth.
-- Handles both snake_case (site_title) and camelCase (siteTitle) column variants
-- in case the production DB has the legacy camelCase column name.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SiteConfig' AND column_name = 'site_title'
  ) THEN
    UPDATE "gallery" g
    SET "name" = sc."site_title"
    FROM "SiteConfig" sc
    WHERE sc."gallery_id" = g.id
      AND sc."site_title" IS NOT NULL
      AND sc."site_title" != '';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SiteConfig' AND column_name = 'siteTitle'
  ) THEN
    UPDATE "gallery" g
    SET "name" = sc."siteTitle"
    FROM "SiteConfig" sc
    WHERE sc."gallery_id" = g.id
      AND sc."siteTitle" IS NOT NULL
      AND sc."siteTitle" != '';
  END IF;
END $$;

ALTER TABLE "SiteConfig" DROP COLUMN IF EXISTS "site_title";
ALTER TABLE "SiteConfig" DROP COLUMN IF EXISTS "siteTitle";
