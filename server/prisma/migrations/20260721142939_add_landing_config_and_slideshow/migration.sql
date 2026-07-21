-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "site_title" TEXT,
ADD COLUMN     "social_facebook" TEXT,
ADD COLUMN     "social_instagram" TEXT,
ADD COLUMN     "tagline_primary" TEXT,
ADD COLUMN     "tagline_secondary" TEXT;

-- CreateTable
CREATE TABLE "slideshow_slide" (
    "id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumb_url" TEXT,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slideshow_slide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slideshow_slide_context_position_idx" ON "slideshow_slide"("context", "position");
