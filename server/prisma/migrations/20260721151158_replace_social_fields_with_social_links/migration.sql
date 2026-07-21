/*
  Warnings:

  - You are about to drop the column `social_facebook` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `social_instagram` on the `site_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "site_config" DROP COLUMN "social_facebook",
DROP COLUMN "social_instagram";

-- CreateTable
CREATE TABLE "social_link" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_link_position_idx" ON "social_link"("position");
