-- Make gallery_id NOT NULL on all scoped tables after confirming backfill is complete.
-- Safe to apply only after seed-melody.ts has run and all rows have gallery_id set.

ALTER TABLE "Painting" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "PrintProduct" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "Spotlight" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "ContactMessage" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "CommissionRequest" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "site_config" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "social_link" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "slideshow_slide" ALTER COLUMN "gallery_id" SET NOT NULL;
ALTER TABLE "daily_analytics" ALTER COLUMN "gallery_id" SET NOT NULL;
