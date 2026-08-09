-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "reference_library_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "works_in_progress_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "work" ADD COLUMN     "show_in_gallery" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "subject" DROP NOT NULL,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "digital_asset" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumb_url" TEXT NOT NULL,
    "original_width" INTEGER,
    "original_height" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_linkage" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "work_id" TEXT,
    "role" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_linkage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "digital_asset_gallery_id_created_at_idx" ON "digital_asset"("gallery_id", "created_at");

-- CreateIndex
CREATE INDEX "asset_linkage_work_id_role_position_idx" ON "asset_linkage"("work_id", "role", "position");

-- CreateIndex
CREATE UNIQUE INDEX "asset_linkage_asset_id_work_id_role_key" ON "asset_linkage"("asset_id", "work_id", "role");

-- AddForeignKey
ALTER TABLE "digital_asset" ADD CONSTRAINT "digital_asset_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_linkage" ADD CONSTRAINT "asset_linkage_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_linkage" ADD CONSTRAINT "asset_linkage_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "digital_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_linkage" ADD CONSTRAINT "asset_linkage_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
