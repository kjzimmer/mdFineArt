# Works in Progress + Digital Library

**Status: IN DEVELOPMENT.** Branch: `feature/works-in-progress-digital-library`. Design agreed
with Karl 2026-08-09, implementation starting same session. This doc is the authoritative spec
while in flight, per WIP file discipline.

## Why

Melody asked for two connected capabilities:

1. **Works in Progress** — start a work before it's finished. No title, subject, or price yet —
   just progress photos with optional captions, added as the piece develops. It becomes a normal
   completed `Work` once real details are filled in; progress photos stay attached afterward for
   review. A public "Works in Progress" page (toggle-controlled, off by default) lets visitors
   follow along if the gallery owner wants that.
2. **Digital Library** — a reusable, gallery-wide pool of reference photos, not owned by any one
   work. A photo can be linked to multiple works over time. Karl generalized this mid-design: he
   wants the underlying architecture to be an extensible "asset + linkage" system — "everything
   is in the digital library, it's the linkages that define how an item is used" — so future
   link types (events, classes, commissions, …) can be added later without a redesign, not just
   a one-off `ReferencePhoto` table.

A third item got folded in because it touches the same `Work` rows: `showInGallery`, a boolean
so Melody can keep a historical work in her records/admin without it appearing on the public
Gallery page — "part of their history but maybe it doesn't represent them well anymore." Defaults
`true` for every work, existing and new, so nothing currently visible disappears.

## Scope boundary (deliberate, agreed with Karl)

This pass does **not** touch `Work.imageUrl` (the work's own primary display image) or retrofit
`SlideshowSlide`/`Testimonial`/`SiteConfig` image fields into the new library system. Those stay
exactly as they are. Only new use cases — reference photos, progress photos — go through the new
`DigitalAsset`/`AssetLinkage` tables in this pass. Migrating the Work primary image into the same
system is a plausible future cleanup, not attempted now, given the size of that read-path blast
radius (gallery grid, admin, invoices, OG tags, SSR, sitemap, order line items) for zero
user-facing benefit today.

This keeps the migration fully additive: no existing `Work` or `SiteConfig` row is altered, no
backfill needed, both new feature toggles default `false` (invisible until explicitly turned on),
`showInGallery` defaults `true` (zero change to current visibility). Confirmed via direct query
after migration — see Verification below.

## Data model

- `Status` enum gains `IN_PROGRESS`.
- `Work.title`, `Work.subject`, `Work.imageUrl` become nullable. `Work.slug` stays required and
  globally unique; for a work with no title yet, it's auto-generated server-side and permanent
  once minted — never regenerated later when a real title is set, since it may already be
  shared/indexed.
- `Work.showInGallery Boolean @default(true)`.
- New `DigitalAsset` — one row per uploaded library image: `imageUrl` (single normalized WebP,
  full native resolution, ~92 quality, no raw-original retained — Karl's explicit call: "high
  quality WebP only" over doubling storage with a second raw-format copy, since these aren't
  archival/print assets the way a Work's primary image is), `thumbUrl`, `originalWidth/Height`,
  `tags String[]` (reserved for future auto-tagging/search — not built yet), `caption`.
- New `AssetLinkage` — describes how a `DigitalAsset` is currently used: `assetId`, `workId?`
  (nullable — future link targets get their own nullable FK column added later, one per target
  type, per Karl's explicit extension intent), `role` (plain string — `"reference"` | `"progress"`
  today, following the repo's existing `context`/`category` string-discriminator convention
  rather than a Prisma enum), `position` (ordering, meaningful for `"progress"` only). An asset
  with zero linkages just sits in the library, unattached — "just a pic."
- No DB-level cascade delete on `AssetLinkage`'s FKs — matches the codebase's existing style for
  `Work`'s other children (explicit `deleteMany` cleanup, not cascade). Three call sites must
  stay in sync: `library.ts DELETE /:id`, `works.ts DELETE /:id` (progress photos only, since
  they're one-off and orphaned otherwise), and the app-admin gallery-delete transaction.

## Upload pipeline

New `uploadLibraryAsset()` in `server/src/lib/r2.ts` — single WebP per photo, full native
resolution (with a 16000px safety cap ahead of WebP's hard 16383px encode ceiling — a scanned or
stitched reference photo could otherwise exceed it and throw an opaque 500; 16000px is still
effectively native for anything a phone/DSLR/scanner produces), no watermark. Reference and
progress photos are internal/admin-only by default and must never leak into any public page — in
particular, reference photos may not be the artist's own copyright to publish.

## API

New `server/src/routes/library.ts`, mounted `/api/library`, all routes behind `requireAdmin`:
upload (multi-file, optional immediate `workId`+`role` linkage), list (optionally filtered by
`workId`+`role`), single-asset detail with its linkages, link, unlink, full delete.

Delete-vs-unlink rule (client-enforced): removing a **progress** photo is always a full delete
(never reused elsewhere). Removing a **reference** photo from one work unlinks only — the asset
stays in the library. Deleting an asset from the Reference Library page itself is a full delete
and must warn how many works currently reference it first.

`server/src/routes/works.ts` also picked up two required, in-scope fixes triggered directly by
adding `IN_PROGRESS`:
- The public `GET /api/works` list currently applies no status filtering at all, and the client's
  `normalizeStatus()` silently maps unrecognized values to `"Available"` — meaning an in-progress
  work would incorrectly display as available on the public Gallery the moment the status value
  exists, unless filtered. Fixed via default exclusion of `IN_PROGRESS`/`showInGallery:false`,
  with explicit opt-in query params (`includeInProgress`, `includeHidden`) for the admin list.
- Same leak risk existed in the SSR `/gallery`, `/gallery/:slug`, and sitemap queries in
  `server/src/index.ts` (also unfiltered by status before this) — fixed the same way.

**Bundled security fix:** while rewriting this file's POST/PUT validation for nullable fields,
confirmed by direct read that `/api/works` had no `requireAdmin` on any route and `PUT /:id` had
no `galleryId` scoping — unauthenticated requests could create/edit works, and any gallery's
admin could edit another gallery's work by id. Karl chose to fix this in the same branch rather
than defer it, since the file was already being substantially rewritten.

## Public surface

**Revised 2026-08-09, after initial build:** Karl reviewed the first pass (a standalone
`/works-in-progress` grid + per-work detail page) and asked to simplify — "I'm not sure we need a
separate in progress page at all." Replaced with: a **Works in Progress section on the Home
page**, showing the single most-recently-active in-progress work (progress-photo slideshow, plus
the work's current/completed image side-by-side if one exists — reusing `SlideshowDisplay`, the
same component `HeroSlideshow` uses). "Most recently active" is computed from the latest progress
photo's `createdAt`, not `Work.updatedAt` (a work's own row rarely changes once created — photo
uploads are the real signal something is being worked on) — see
`server/src/lib/featuredInProgress.ts`, shared by the SSR `/` route and the public
`GET /api/works/featured-in-progress` endpoint.

The standalone page, its routes, its TopNav link, and `renderWorksInProgress`/sitemap/nav entries
in `storyContent.ts` were all removed as part of this revision — no per-work deep link exists
anymore. `SiteConfig.worksInProgressEnabled` (still default `false`) now gates only the Home
section (client + SSR), not a separate route.

The `showInGallery` checkbox on a work is reused rather than adding a second toggle — Karl's
call ("use the show in public gallery checkbox but change it to show on landing page"). Its label
in `AdminPaintings.tsx` is now conditional: "Show on landing page" for an `IN_PROGRESS` work,
"Show in public gallery" otherwise — same underlying field, contextual meaning.

Reference Library is unaffected by this revision — still admin-only, its own toggle
(`SiteConfig.referenceLibraryEnabled`, default `false`) gates only the `AdminLayout.tsx` nav tab,
no public page, no SSR, no sitemap entry.

## Admin surface

- New "Reference Library" admin tab (`AdminReferenceLibrary.tsx`) — gallery-wide browse grid,
  upload directly to the library, click-to-enlarge, delete with a "used in N works" warning.
- Work editor (`AdminPaintings.tsx`) gains: an "In Progress" status option (title/image
  validation skipped for that status), a "Start In-Progress Work" shortcut, a Progress Photos
  section (upload only — always fresh captures, never picked from the library) and a Reference
  Photos section (pick existing library assets via a multi-select picker, or upload a new photo
  directly from the work editor — both land in the shared library), and a "Show in public
  gallery" checkbox bound to `showInGallery`.
- New shared `MediaLightbox.tsx` — a generic image-list viewer (prev/next, keyboard nav, close,
  no Work-specific metadata or CTA), used by the library browse grid, both photo sections in the
  work editor, and the Home page's Works in Progress viewer. The existing public `Lightbox.tsx`
  is tightly coupled to the `Work` domain type and is a live, tested feature — this work does not
  touch it. Also supports zoom/pan (mouse wheel zoom centered on cursor, click-drag pan,
  pinch-to-zoom on touch, double-click toggle, reset button) — added per Karl's request so
  Melody can inspect specific areas of a reference photo up close while painting from it. No new
  dependency; hand-rolled to match the codebase's existing pattern of bespoke lightweight
  components rather than a carousel/zoom library.

## Full plan

See the approved implementation plan for the complete file-by-file breakdown, migration
sequencing, and verification checklist (schema diff, every server/client file touched, git/docs
steps). Summarized here for anyone picking this doc up independently; the plan file itself is the
step-by-step execution record for this session.

## Follow-ups, not done in this pass

- `docs/ROADMAP.md`'s Phase 3 "Reference photo library" line is stale/too narrow once this ships
  — flagged to Karl to update manually (ROADMAP.md isn't in CLAUDE.md's CC-editable list).
- CLAUDE.md `## Current State` and `server/src/routes/support.ts`'s `SYSTEM_PROMPT` both get
  updated together when this actually ships, per the standing Support Agent Sync rule — not
  during this in-flight branch.
- A future pass could migrate `Work`'s own primary image into a `"primary"`-role `AssetLinkage`
  for full architectural consistency — explicitly deferred, see Scope boundary above.
