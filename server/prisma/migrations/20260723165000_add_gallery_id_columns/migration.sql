-- Add nullable gallery_id to all gallery-scoped tables
-- All columns nullable initially; backfill runs next, then NOT NULL + FK constraints

-- Painting
ALTER TABLE "Painting" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "Painting" ADD CONSTRAINT "Painting_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PrintProduct
ALTER TABLE "PrintProduct" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "PrintProduct" ADD CONSTRAINT "PrintProduct_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Spotlight
ALTER TABLE "Spotlight" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "Spotlight" ADD CONSTRAINT "Spotlight_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order
ALTER TABLE "Order" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- NewsletterSubscriber
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ContactMessage
ALTER TABLE "ContactMessage" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CommissionRequest
ALTER TABLE "CommissionRequest" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "CommissionRequest" ADD CONSTRAINT "CommissionRequest_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- site_config (unique: one config per gallery)
ALTER TABLE "site_config" ADD COLUMN "gallery_id" TEXT;
CREATE UNIQUE INDEX "site_config_gallery_id_key" ON "site_config"("gallery_id");
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- social_link
ALTER TABLE "social_link" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "social_link" ADD CONSTRAINT "social_link_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- slideshow_slide
ALTER TABLE "slideshow_slide" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "slideshow_slide" ADD CONSTRAINT "slideshow_slide_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- daily_analytics
ALTER TABLE "daily_analytics" ADD COLUMN "gallery_id" TEXT;
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
