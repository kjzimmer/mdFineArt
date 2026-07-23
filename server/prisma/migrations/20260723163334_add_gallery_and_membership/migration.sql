-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "is_app_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "gallery" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custom_domain" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_membership" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_slug_key" ON "gallery"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_custom_domain_key" ON "gallery"("custom_domain");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_membership_person_id_gallery_id_key" ON "gallery_membership"("person_id", "gallery_id");

-- AddForeignKey
ALTER TABLE "gallery_membership" ADD CONSTRAINT "gallery_membership_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_membership" ADD CONSTRAINT "gallery_membership_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
