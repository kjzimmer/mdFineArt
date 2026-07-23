-- Add preview_domain and cf_zone_id to gallery
ALTER TABLE "gallery" ADD COLUMN "preview_domain" TEXT;
ALTER TABLE "gallery" ADD COLUMN "cf_zone_id" TEXT;

-- Backfill Melody's Cloudflare zone ID
UPDATE "gallery" SET "cf_zone_id" = '26289efa025fead9fe1ac254d3dc97c6' WHERE slug = 'melody';

-- Unique index on preview_domain (nullable — NULLs are not constrained)
CREATE UNIQUE INDEX "gallery_preview_domain_key" ON "gallery"("preview_domain");

-- Fix DailyAnalytics: replace single-field @unique(date) with compound @@unique([date, galleryId])
DROP INDEX "daily_analytics_date_key";
CREATE UNIQUE INDEX "daily_analytics_date_gallery_id_key" ON "daily_analytics"("date", "gallery_id");
