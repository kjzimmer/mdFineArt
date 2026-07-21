-- CreateTable
CREATE TABLE "site_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "commissions_enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured_enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured_count" INTEGER NOT NULL DEFAULT 6,
    "newsletter_enabled" BOOLEAN NOT NULL DEFAULT true,
    "events_enabled" BOOLEAN NOT NULL DEFAULT true,
    "show_price" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);
