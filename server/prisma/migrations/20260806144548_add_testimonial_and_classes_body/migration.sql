-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "classes_body" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "testimonial" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_detail" TEXT,
    "quote" TEXT NOT NULL,
    "photo_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonial_gallery_id_context_sort_order_idx" ON "testimonial"("gallery_id", "context", "sort_order");

-- AddForeignKey
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
