-- CreateTable
CREATE TABLE "person_gallery_link" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_gallery_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_gallery_link_person_id_gallery_id_key" ON "person_gallery_link"("person_id", "gallery_id");

-- AddForeignKey
ALTER TABLE "person_gallery_link" ADD CONSTRAINT "person_gallery_link_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_gallery_link" ADD CONSTRAINT "person_gallery_link_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
