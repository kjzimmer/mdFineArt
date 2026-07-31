-- CreateTable
CREATE TABLE "support_message" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_log" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_message_gallery_id_created_at_idx" ON "support_message"("gallery_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_log" ADD CONSTRAINT "support_log_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
