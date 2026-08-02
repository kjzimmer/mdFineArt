# Gallery Discoverability

Full-scope version of the Phase 2 roadmap item. Goal: make every gallery's actual "story"
content — not just link-preview metadata — visible to AI answer engines and traditional
search crawlers, across all public content types, for every tenant.

## Why this is bigger than the OG-tag work

The [[work-sharing]] feature added a head-tag swap for `/gallery/:slug` (title, description,
image) so shared links preview correctly. That solves link previews. It does **not** solve
discoverability, because AI answer engines increasingly rank on narrative quality — the
compelling story a gallery tells — not on metadata. A `<meta description>` tag can't carry a
bio, an artist statement, or a commission pitch. Crawlers that don't execute JavaScript
(GPTBot, ClaudeBot, PerplexityBot, CCBot, and to a lesser extent Bingbot) see only the raw
HTML the server returns — for every route except `/gallery/:slug`, that's currently the empty
Vite SPA shell. The actual story lives entirely client-side.

## Approach: universal server-rendered content shell (not bot-keyed dynamic rendering)

Classic "dynamic rendering" (detect bot user-agents, serve a prerendered snapshot only to
them) was the default recommendation earlier in this discussion, but it has real downsides
here:
- Requires maintaining a bot user-agent allowlist that's always one new crawler behind
- Serving different content to bots vs. real users is the textbook definition of cloaking —
  Google's own dynamic-rendering guidance warns this needs to be done carefully to avoid
  looking like manipulation
- Would need a headless browser (Puppeteer/Playwright) running server-side to render the
  actual React app per request — heavy infra (memory, cold starts, another moving part on
  Railway) for content that is, underneath, just paragraphs of text and images already sitting
  in Postgres

**Better fit for this app:** the gallery "story" content (bio, artist statement, work
descriptions, event descriptions, commission pitch, future free-form page bodies) is server-
known data, not client-computed UI. So instead of rendering the *app*, server-render the
*content* — inject a plain-HTML snapshot of the visible text/images into the initial response
for every route, for every request, regardless of who's asking. React mounts and hydrates over
it immediately for real users (invisible, no flash, arguably better no-JS/slow-connection
fallback too). No bot detection, no cloaking risk, no headless browser. This extends the exact
pattern already proven in `server/src/index.ts` for `/gallery/:slug` — read `dist/index.html`,
inject content, fall through to the plain shell on any resolution miss — just applied to more
routes and to `<body>` content, not only `<head>` tags.

Caching: skip it for v1, same posture as the existing OG-tag lookup (`docs/wip/work-sharing.md`
scope notes) — a few Prisma reads per request is fine at early-adopter scale; revisit only if
this becomes a measured hot path.

## Routes in scope (full works, not just the share-link case)

| Route | Story content to server-render |
|---|---|
| `/` (home) | Taglines, hero context, short story hook if configured |
| `/gallery` (works index) | Listing of works with titles/descriptions, not just thumbnails |
| `/gallery/:slug` (single work) | Upgrade existing handler: full description/medium/dimensions in body, not just head meta |
| `/about` | Bio paragraphs, artist statement, professional memberships, shows, awards, media, past galleries |
| `/commission` | Intro copy, commission pitch/policy paragraphs |
| `/events` | Event listings — title, date, venue, description |
| `/contact` | Contact copy (lower story value, cheap to include for completeness) |

Each of these is driven by data already in Prisma (`SiteConfig`, `Work`, `Event`) — the server
render is a template over existing queries, not new data modeling.

## Extensibility: content types that don't exist yet

Two parking-lot features need to plug into this same pipeline when they're eventually built,
so the pipeline should be designed generically (a render template registered per route/content
type) rather than hand-special-cased per current page:

- **Classes** (Phase 3 candidate, not built) — same treatment as Events once it exists.
- **Free-form custom pages** (parking lot, not built) — came up directly from Melody wanting a
  Music page; art + music + wild horse advocacy is part of *her* story specifically, and other
  artists will have their own equivalent tangents. A free-form page is exactly the kind of
  content an answer engine needs to see to represent an artist's full story, not just their
  inventory — so when that feature is built, it must be wired into this same server-render
  pipeline on day one, not bolted on later as an SEO gap.

This WIP does not build Classes or Free-form pages — it only ensures the rendering approach
doesn't have to be redesigned when they land.

## Complementary, near-zero-cost additions (bundle into this work)

- **`robots.txt`** per gallery — disallow `/admin`, allow everything public
- **`sitemap.xml`** per gallery — enumerate that gallery's own works/events/pages, resolved the
  same way `resolveGallery` already resolves tenants (host header → customDomain/previewDomain)
- **JSON-LD structured data** (`schema.org` `VisualArtwork`, `Person`, `Organization`) injected
  alongside the content shell — highest signal-to-effort ratio for AI crawlers since it's
  parseable without any content-quality judgment on the crawler's part

## Multi-tenant considerations

Every piece of this resolves gallery the same way the existing `/gallery/:slug` handler and
`resolveGallery` middleware do — host header first, then `customDomain`/`previewDomain` lookup,
`GALLERY_SLUG` env fallback for local dev. No gallery-specific branching; one implementation
serves all tenants.

## Content completeness is not a blocker — it's the point

Server-rendering `SiteConfig` faithfully only surfaces what's actually in it, and the About
page still has hardcoded fallbacks "until Melody populates config" (per CLAUDE.md Current
State). That's fine — not a gap to close before shipping this. The reason this pipeline and the
parking-lot **AI gallery review** matter *especially* while early-adopter content is thin is
diagnostic: once a gallery's story is actually visible to a crawler, an AI review of that same
content can tell the artist what's missing and where quality is weak, functioning as content
coaching rather than a pass/fail SEO score. Rendering thin content isn't a failure state for
this feature — it's the exact case the review is meant to catch and act on. Sequencing still
holds (rendering has to land before there's anything to review), but the two should be thought
of as one coaching loop, not "infra" then separately "polish."

## Explicitly out of scope here

- Headless-browser rendering / true dynamic rendering — not needed given the content-shell
  approach above; revisit only if server-known data proves insufficient (e.g., if the story
  needs to show computed/interactive layout, which it doesn't today)
- Next.js migration — long-term answer for full SSR/SSG, deliberately parked; this WIP is the
  "what we can do now in React/Vite" scope
- Building Classes or Free-form pages themselves — separate roadmap/parking-lot items
