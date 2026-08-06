-- One-time backfill: any pre-existing SiteConfig.classesImageUrl becomes a
-- SlideshowSlide(context='classes') row, so production data (melodydebenedictis.com)
-- isn't lost when the app stops reading classesImageUrl directly.
-- classes_image_url column is left in place (deprecated, unused going forward) —
-- see CLAUDE.md Gray Area list.
INSERT INTO "slideshow_slide" (id, gallery_id, context, image_url, position, created_at, updated_at)
SELECT gen_random_uuid()::text, gallery_id, 'classes', classes_image_url, 0, now(), now()
FROM "site_config"
WHERE classes_image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "slideshow_slide" s
    WHERE s.gallery_id = site_config.gallery_id AND s.context = 'classes'
  );
