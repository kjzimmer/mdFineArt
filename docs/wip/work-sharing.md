# Work Sharing

Share button on the public work lightbox that generates a link back to the gallery page
with that work's modal pre-opened — i.e. the same experience as a visitor going to
`/gallery` and clicking "view" on that piece, not a separate single-work microsite.

## URL scheme

`/gallery/:slug` — same `Gallery` page/route element as `/gallery`, just with a `slug`
route param. `Work.slug` is globally unique in the DB, so no gallery-scoping needed for
the lookup itself (though the OG-meta route below still scopes by resolved gallery for
correctness/consistency with the rest of the app).

The URL stays in sync both ways:
- Visiting `/gallery/:slug` directly opens that work's modal on load.
- Opening/closing/navigating (prev/next) the modal from the grid updates the URL via
  `navigate(..., { replace: true })` — no history spam, but the current URL always
  matches the open work, so the Share button can just read `window.location`.

Deep-linked opens rely on default filters (`subject: 'All'`, `status: 'All'`) matching
everything, which is the real-world case for a fresh page load from a shared link. No
separate "unfiltered" work list was introduced for lightbox nav — prev/next in a
deep-linked session still respects whatever filters are active, same as today.

## Share button behavior (Lightbox)

- `navigator.share()` when available (iOS Safari, Android Chrome) — opens the native OS
  share sheet with the work's title/url.
- Falls back to `navigator.clipboard.writeText()` + a 2s "✓ Link copied" label swap,
  matching the existing "Copy invoice link" pattern in `AdminOrders.tsx`. No toast
  library in this app — don't introduce one for this.

## Rich link previews (Open Graph)

Site is a pure Vite SPA — the raw HTML any link-preview bot fetches is a generic shell,
so without server-side handling, shared links paste with no image/title (true of
`/invoice/:token` links too, not a regression).

`server/src/index.ts` gets a new `GET /gallery/:slug` handler, registered before the
static/catch-all block, that:
1. Resolves gallery the same way `resolveGallery` middleware does (X-Gallery-Hostname /
   hostname → `customDomain`/`previewDomain` → `GALLERY_SLUG` env fallback for dev).
2. Looks up the work by slug within that gallery.
3. If both resolve: reads `client/dist/index.html`, replaces the `<title>` with
   OG/Twitter meta tags carrying the work's title, dimensions/medium as description, and
   `fullResUrl`/`imageUrl` as the preview image, then sends that instead of the generic
   shell.
4. If gallery or work isn't found (or `client/dist` doesn't exist, i.e. dev mode): calls
   `next()` and falls through to the normal SPA shell — no hard 404, consistent with how
   the rest of the app treats unknown routes.

Real browsers get the same React bundle either way — the meta-tag swap is a
pre-hydration head change, not a different app. Client-side routing then opens the modal
normally via the `:slug` param.

## Scope notes

- No caching of the read `index.html` template or the gallery/work lookup — acceptable
  at current scale (early adopter MVP), revisit if this becomes a hot path.
- Deep link to a slug that doesn't exist (stale/bad link): app loads normally at
  `/gallery`, no modal opens, no error UI. Silent soft-fail, not surfaced to the user.
- Did NOT build: a dedicated single-work URL/page (no nav, distraction-free) — that's a
  richer alternative, parked in `docs/ROADMAP.md` if a future adopter wants it.

## Known issues (open, 2026-08-02)

Set aside mid-investigation to focus on the broader discoverability topic — pick back up
before calling this feature done:

- Copy-link fallback's rich-text clipboard write (`text/html` via `ClipboardItem`,
  `Lightbox.tsx` `handleShare`) was added but pasting into an email compose box did not
  produce a hyperlink as expected — needs to be re-tested/debugged, not confirmed working.
- Messenger still does not unfurl the shared link even after fixing `og:image` to point at
  `work.imageUrl` (the optimized WebP) instead of `work.fullResUrl`. Root cause not yet
  found — the size/format theory didn't fully explain it. Next step: use the Facebook
  Sharing Debugger against a live production `/gallery/:slug` URL to see the actual scrape
  result/error, and/or `curl` the route with a `facebookexternalhit` user agent to inspect
  the raw HTML Facebook's crawler receives.
