-- Remove legacy Person.isAdmin (replaced by GalleryMembership.isAdmin)
ALTER TABLE "Person" DROP COLUMN IF EXISTS "is_admin";

-- Remove Railway DNS storage fields (no longer needed with Worker approach)
ALTER TABLE "gallery" DROP COLUMN IF EXISTS "railway_cname_target";
ALTER TABLE "gallery" DROP COLUMN IF EXISTS "railway_txt_value";

-- Add Cloudflare nameservers array (shown to client for NS configuration)
ALTER TABLE "gallery" ADD COLUMN "cf_nameservers" TEXT[] NOT NULL DEFAULT '{}';

-- Add pre-migration DNS snapshot for support reference
ALTER TABLE "gallery" ADD COLUMN "cf_dns_snapshot" JSONB;
