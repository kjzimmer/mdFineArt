-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "commission_body" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "commission_title" TEXT;
