-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "contact_body" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contact_heading" TEXT,
ADD COLUMN     "contact_image_caption" TEXT;
