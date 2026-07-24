-- Add Railway DNS record storage to gallery
ALTER TABLE "gallery" ADD COLUMN "railway_cname_target" TEXT;
ALTER TABLE "gallery" ADD COLUMN "railway_txt_value" TEXT;
