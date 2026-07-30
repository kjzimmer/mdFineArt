-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "classes_heading" TEXT,
ADD COLUMN     "classes_image_url" TEXT,
ADD COLUMN     "classes_label" TEXT;

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "event_time" TEXT,
    "venue" TEXT NOT NULL,
    "description" TEXT,
    "external_link" TEXT,
    "image_url" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_offering" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inquire_subject" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_offering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_gallery_id_event_date_idx" ON "event"("gallery_id", "event_date");

-- CreateIndex
CREATE INDEX "class_offering_gallery_id_sort_order_idx" ON "class_offering"("gallery_id", "sort_order");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_offering" ADD CONSTRAINT "class_offering_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
