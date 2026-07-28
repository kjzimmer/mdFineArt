-- Rename Painting table to work (preserves all data)
ALTER TABLE "Painting" RENAME TO "work";

-- Rename slug unique index
ALTER INDEX "Painting_slug_key" RENAME TO "work_slug_key";

-- Rename primary key constraint
ALTER TABLE "work" RENAME CONSTRAINT "Painting_pkey" TO "work_pkey";

-- Drop old FK constraints that reference Painting
ALTER TABLE "work" DROP CONSTRAINT "Painting_gallery_id_fkey";
ALTER TABLE "PrintProduct" DROP CONSTRAINT "PrintProduct_paintingId_fkey";
ALTER TABLE "Spotlight" DROP CONSTRAINT "Spotlight_paintingId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_paintingId_fkey";

-- Rename FK columns in related tables
ALTER TABLE "PrintProduct" RENAME COLUMN "paintingId" TO "work_id";
ALTER TABLE "Spotlight" RENAME COLUMN "paintingId" TO "work_id";
ALTER TABLE "OrderItem" RENAME COLUMN "paintingId" TO "work_id";

-- Drop old Spotlight unique index on paintingId and recreate on work_id
ALTER INDEX "Spotlight_paintingId_key" RENAME TO "Spotlight_work_id_key";

-- Add new columns
ALTER TABLE "work" ADD COLUMN "media_type" TEXT;
ALTER TABLE "site_config" ADD COLUMN "media_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "site_config" ADD COLUMN "works_label" TEXT;

-- Recreate FK constraints with updated names
ALTER TABLE "work" ADD CONSTRAINT "work_gallery_id_fkey"
  FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PrintProduct" ADD CONSTRAINT "PrintProduct_work_id_fkey"
  FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Spotlight" ADD CONSTRAINT "Spotlight_work_id_fkey"
  FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_work_id_fkey"
  FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
