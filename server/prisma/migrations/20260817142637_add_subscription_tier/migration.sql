-- AlterTable
ALTER TABLE "feature" ADD COLUMN     "minimum_tier_id" TEXT;

-- AlterTable
ALTER TABLE "gallery" ADD COLUMN     "subscription_tier_id" TEXT;

-- CreateTable
CREATE TABLE "subscription_tier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "previous_tier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_tier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_tier_previous_tier_id_key" ON "subscription_tier"("previous_tier_id");

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_subscription_tier_id_fkey" FOREIGN KEY ("subscription_tier_id") REFERENCES "subscription_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature" ADD CONSTRAINT "feature_minimum_tier_id_fkey" FOREIGN KEY ("minimum_tier_id") REFERENCES "subscription_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_tier" ADD CONSTRAINT "subscription_tier_previous_tier_id_fkey" FOREIGN KEY ("previous_tier_id") REFERENCES "subscription_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
