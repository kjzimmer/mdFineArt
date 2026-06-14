# SITE_DESIGN.md — Melody DeBenedictis Artist Website

> This file covers page-by-page design, features, and visual spec.
> Update freely as the design evolves — changes here don't affect core CC instructions.
> For tech stack, schema, API routes, and dev setup, see `CLAUDE.md`.

---

## Visual Identity

### Palette — earthy western fine art

```css
--color-bg:           #0f0d0b;   /* near-black warm — main background */
--color-surface:      #1a1612;   /* card / panel background */
--color-border:       #2e2820;   /* subtle dividers */
--color-text:         #f0e8dc;   /* warm off-white — primary text */
--color-muted:        #8a7c6e;   /* secondary / caption text */
--color-accent:       #c4843a;   /* burnt sienna / gold — CTAs, highlights */
--color-accent-hover: #d9953f;
--color-sold:         #6b5a4e;   /* muted brown for SOLD badge */
--color-success:      #4a7c59;
```

### Typography

```css
--font-display: 'Cormorant Garamond', serif;   /* headings, painting titles, hero */
--font-body:    'Inter', sans-serif;            /* body copy, UI, forms */
```

### General UI Rules
- Dark background throughout — let paintings be the color
- Minimal chrome; generous whitespace around artwork
- Rounded-sm for cards; rounded-none for hero/full-bleed elements
- Accent color used sparingly — buttons, hover states, price highlights
- No drop shadows on painting images — they float naturally on dark bg

---

## Navigation

Top nav order: **About · Gallery · Events · Music · Classes · Blog · Commissions**

Social icons (left of nav, below site name):
- Facebook: `text-[#1877F2]` brand blue, 20×20px, `hover:text-accent`
- Instagram: `text-[#E1306C]` brand pink, 20×20px, `hover:text-accent`

All nav links: `hover:text-accent` (burnt sienna / gold). Active link: `text-accent`.

---

## Site-Wide Interaction

- **All clickable links and buttons** use `hover:text-accent` for hover color throughout the site — nav tabs, filter pills, gallery prev/next, footer links, inline text links.

---

## Pages

### Home (`/`)

**Hero section** — two-column grid, left col wider (1.4fr)

Left column:
- Title: "Painter of the West and Its Wild" — `text-4xl sm:text-5xl`, display font, top of column
- Subtitle: "Bold color, quiet storytelling, deep atmosphere." — `text-2xl text-text/70`
- Two CTA buttons pinned to bottom via `mt-auto`: "View Gallery" → `/gallery`, "Commission a Painting" → `/commission`. Both `bg-accent` orange.

Right column:
- **Photo slideshow** (`HeroSlideshow` component, `client/src/components/HeroSlideshow.tsx`):
  - Fixed 340px tall container; images `object-cover` via `position: absolute`
  - Auto-advances every 5 seconds with 0.4s opacity fade
  - 5 slides: `melLanding.jpg`, `studio.jpg`, `melInAction.jpg`, `melOnBelle.jpg`, `melSnowCat.jpg`
  - Each slide has its own caption rendered below the image
  - Dot indicators (clickable) overlaid at bottom of image
  - Rounded-[2rem] card with border and `shadow-soft`
- **Newsletter signup card** below slideshow:
  - "Stay connected" label, opt-in form with name (optional) + email
  - Shows subscribed state with unsubscribe link; email stored in localStorage

Hero background: `radial-gradient` + `linear-gradient`, hero painting image (`Bays and Blues` fetched via `/api/paintings?search=Bays+and+Blues`) as absolute-positioned `<img>` with `filter: brightness(0.70) sepia(0.5) saturate(0.6)`, `opacity: 0.9`. `maskImage: none` (no vignette clip). Section has `border border-border`.

**Featured Works**
- `<h2>Featured Works</h2>` header + "See full gallery" link (`hover:text-accent`)
- Grid of paintings with `featured: true`
- Only rendered if at least one featured painting exists

---

### Gallery (`/gallery`)

**Layout**
- Uniform grid: 4 col desktop / 3 col tablet / 2 col mobile
- Default sort: featured first, then newest (`sortOrder` then `createdAt` desc)

**Filter Bar**
- Subject filter pills (only shown when `galleryConfig.showSubject` is true): All | Mustangs | Wildlife | Landscape | Equine | Portrait
- Status filter pills: All | Available | Sold | NFS
- Active pill: `border-accent bg-accent/10 text-accent`; inactive: `hover:border-accent hover:text-accent`

**Painting Card**
- Image (aspect ratio preserved, object-fit cover)
- Title (display font)
- Dimensions + medium (muted)
- Price or "SOLD" badge
- Hover: subtle scale + accent border

**Lightbox Modal**
- Triggered on card click
- Full-size image (left 60%), `h-[70vh] object-contain`
- Right panel: title, dimensions, medium, year, status badge, prints-available badge, description, price, tags
- Action button: "Inquire about this painting" → opens inquiry form
- Keyboard nav: ← → to browse paintings, Esc to close
- Prev / Next buttons: `hover:text-accent`

---

### Painting Detail (`/gallery/:slug`)

- SEO page, shareable URL per painting
- Large image left, full details right
- Print options section below (if `printsAvailable: true`):
  - Paper print vs canvas print tabs
  - Size options with prices
  - Add print to cart
- "You May Also Like" — 3 paintings sharing the same subject tag

---

### About (`/about`)

Three main sections, stacked vertically.

**Artist Bio card**
- `<h1>Artist Bio</h1>` (no accent label above it)
- Bio text: Melody's full professional bio (Western oil painter, Westcliffe CO, subjects include mustangs, wildlife, landscape, equine, portrait)
- Below bio text: "Professional Memberships" white header + row of org logos (`h-16 w-24 object-contain`, each with `title="{full org name}"` for hover tooltip). Current logos: Sangres Art Guild, WAOW, CAA.
- Right column: `melOnBelle.jpg` photo — absolute positioned, fills column, bottom gradient fade (`linear-gradient(to top, rgba(15,13,11,0.75) 0%, transparent 45%)`), `min-h-[420px]`

**Artist Statement section** (below bio card)
- `<h2>Artist Statement</h2>`, subtitle: "The Art, Music and Songwriting of Melody De Benedictis"
- Four statement paragraphs
- Below text: two-photo horizontal strip — `melInAction.jpg` (left, gradient on right edge) + `melSnowCat.jpg` (right, gradient on left edge). Each `min-height: 260px`, `object-cover`, gradient overlays on inner edges using `position: absolute` divs.

**Contact card** (below statement)
- Heading: "Have a question or just want to say hello, send us a note."
- Second heading (same size): "Press inquiries, speaking engagements."
- Smaller text: "For painting inquiries, commission requests, or class sign-ups use the dedicated forms."
- Right column: `studio.jpg` photo with gradient overlay + text at bottom
- Link to `/contact` form

---

### Commission (`/commission`)

**Process Section**
Three-step visual:
1. Submit your inquiry
2. Receive a quote + timeline
3. Watch it come to life

**Pricing Estimator**
Interactive widget — user selects subject type + size range → shows estimated price band:
- Small (under 16×20): starting at $1,800
- Medium (up to 24×36): starting at $4,200
- Large (36×48+): starting at $8,500
- Note: "Final pricing depends on complexity and reference materials"

**Commission Request Form**
Fields: name, email, phone, subject (what to paint), requested size, budget,
deadline, description / vision, upload reference images (up to 5, max 10MB each)

Auto-reply email sent on submission confirming receipt.

---

### Shop / Cart (`/cart`) + Checkout (`/checkout`)

**Cart**
- Persistent via localStorage + CartContext
- CartDrawer slides in from right on "Add to Cart"
- Supports originals and prints in same cart
- Line items: image thumb, title, type (Original / Paper Print / Canvas Print), size, price, remove button
- Subtotal, tax estimate, total

**Checkout**
- Customer info: name, email, phone
- Shipping address
- Square Web Payments card form (iframe)
- Order summary sidebar
- Submit → confirmation page

**Order Confirmation (`/order-confirmation/:id`)**
- Thank you message
- Order summary
- "A confirmation has been sent to your email"
- Newsletter opt-in checkbox

---

### Events (`/events`)

- Upcoming events at top, past events below (collapsed/muted)
- Event card: cover image, title, date + time, location, short description
- "Register" button if `registrationOpen: true`

**Registration Modal**
- Name, email, number of guests
- Submit → confirmation email to registrant + notification to admin

---

### Blog / Studio Journal (`/blog`)

- Grid: cover image, title, excerpt, date, tags
- Filter by tag
- Newsletter CTA at bottom of every post

**Post page (`/blog/:slug`)**
- Cover image hero
- Body rendered from Markdown
- Author block (Melody's photo + short bio)
- Tags
- Related posts (same tag)
- Newsletter CTA

---

### Exhibitions & Awards (`/exhibitions`)

Static-ish page, managed as a rich content page via admin.
Content: list of shows, galleries, awards, magazine features, press mentions.
Pull from BlogPost with tag "exhibitions" or a dedicated static page.

---

### The Music (`/music`)

- Clean page, consistent with site aesthetic
- Embedded audio player or links to Spotify/Apple Music/SoundCloud
- Brief intro text about Melody's songwriting
- Album art displayed as artwork cards (same card style as paintings)

---

### Contact (`/contact`)

**Contact Form**
Fields: name, email, phone, subject (dropdown: General | Purchase Inquiry |
Commission | Events | Press), message

**Contact Details**
- Phone: (505) 429-6597
- Studio: Westcliffe, CO — by appointment
- Social: Facebook, Instagram

Auto-reply on submission. Admin notified by email.

---

## Admin Panel (`/admin`)

Single admin user (Melody). Protected by JWT. Accessible at `/admin` only.

### Login (`/admin/login`)
- Email + password form
- JWT stored in httpOnly cookie

### Dashboard (`/admin`)
Quick-stat cards:
- Total paintings / available / sold
- Pending orders
- New commission requests
- Unread contact messages
- Upcoming events
- Newsletter subscribers

Recent activity feed (last 10 actions across all sections).

### Paintings Manager (`/admin/paintings`)

**List view**
- Table: thumbnail, title, status badge, price, featured toggle, actions
- Search by title
- Filter by status / subject
- Bulk action: mark selected as Sold

**Add / Edit Painting**
Form fields:
- Title
- Slug (auto-generated, editable)
- Image upload (drag & drop → uploads to R2, shows preview)
- Width + Height (inches)
- Medium (default: "Oil on gallery wrap canvas")
- Subject tags (multi-select)
- Year
- Price (blank = NFS)
- Status (Available / Sold / Reserved / NFS)
- Description (short, shown in lightbox)
- Story (longer collector text, shown on detail page)
- Awards (add multiple)
- Featured toggle
- Sort order (drag-to-reorder on list view)
- Prints available toggle → if on, show print products section

**Print Products (per painting)**
- Add paper and/or canvas print variants
- Each: type, size (e.g. "16×21.5"), price, Square item/variation ID

### Orders (`/admin/orders`)
- Table: order ID, customer name, items, total, status, date
- Detail view: all items, shipping address, Square payment ID, timeline
- Update status: Pending → Paid → Shipped → Fulfilled
- Manual order entry for in-person Square sales

### Commission Requests (`/admin/commissions`)
- Inbox sorted by status (New first)
- Detail: all form fields + reference image thumbnails (click to enlarge)
- Status workflow: New → Reviewing → Quoted → Accepted → In Progress → Complete → Declined
- Admin notes field (internal only)

### Events Manager (`/admin/events`)
- Create / edit / delete events
- Toggle: Published, Registration Open
- Registrations list per event, export to CSV

### Blog Manager (`/admin/blog`)
- Post list: title, status, published date, tags
- Editor: title, slug, excerpt, cover image upload, body (Markdown editor — react-md-editor),
  tags, draft/publish toggle

### Newsletter (`/admin/newsletter`)
- Subscriber list with name, email, source, date, active status
- Export to CSV
- Compose broadcast: subject + body (Markdown or plain text)
- Send via Resend/SendGrid

### Contact Messages (`/admin/contact`)
- Inbox: name, subject, date, read/unread indicator
- Detail view: full message + contact info
- Mark read / Reply (opens email client or in-app reply)

### Analytics (`/admin` → Analytics tab)

Tab in admin nav. Data sourced from Cloudflare's GraphQL Analytics API (proxied through Express backend to keep credentials in server env). Two data sources:

| Source | Requires | What it provides |
|---|---|---|
| Zone Analytics | Nothing extra (free, always on) | Unique visitors, page views, requests, bandwidth, top countries |
| Web Analytics (RUM) | JS beacon in `<head>` | Top pages, referrers, device type, browser/OS |

**UI Layout:**
- Range selector: 7d / 14d / 30d pill buttons
- Stat cards (3-up): Unique Visitors · Page Views · Total Requests
- Line chart: Unique Visitors + Page Views over time (Recharts `LineChart`)
- Country breakdown: horizontal progress bars, top 5 countries by share
- Device type: bar chart (Desktop / Mobile / Tablet) — labeled "Requires Web Analytics beacon"
- Top Pages table — labeled "Requires Web Analytics beacon"
- Top Referrers table — labeled "Requires Web Analytics beacon"

**Data retention plan:** Backend route writes each day's aggregate to a `DailyAnalytics` table in PostgreSQL after fetching from Cloudflare, so history accumulates indefinitely (Cloudflare only keeps 30 days). This enables seasonal/year-over-year trend views.

**Backend:** `GET /api/admin/analytics?range=30d` — requires admin JWT, cached 15 minutes in memory, fetches Cloudflare GraphQL API.

**Chart library:** Recharts (`recharts@3.x`) — dark-themed to match admin palette.

**Current state (as of 2026-06):** Frontend component live with mock data (`AdminAnalytics.tsx`). Cloudflare API integration and DB persistence are next steps. Component gracefully shows "Requires Web Analytics beacon" labels on RUM sections when beacon is not configured.

**Env vars needed (server):**
```
CF_ANALYTICS_TOKEN=   # API token with Analytics:Read scope
CF_ZONE_ID=
CF_ACCOUNT_ID=
CF_WEB_ANALYTICS_SITE_TAG=   # optional, enables RUM data
```

Full implementation spec archived at `docs/archive/ADMIN_ANALYTICS.md`.

---

## SEO & Meta

- Each painting detail page: title = painting name, description = first 160 chars of description
- og:image = painting imageUrl for social sharing
- Gallery page: canonical URL with filter params stripped
- Blog posts: full Open Graph tags
- sitemap.xml auto-generated from published paintings + blog posts

---

## Responsive Breakpoints (Tailwind)

| Breakpoint | Width   | Gallery columns |
|------------|---------|-----------------|
| Mobile     | < 640px | 1               |
| sm         | 640px+  | 2               |
| md         | 768px+  | 3               |
| lg         | 1024px+ | 4               |
| xl         | 1280px+ | 4 (wider cards) |

---

## Future / v2 Ideas

- "Notify me when available" waitlist on sold paintings
- Instagram feed integration on home page
- Virtual studio tour (video embed)
- Print-on-demand fulfillment (Printful) integration
- Collector profile / purchase history (requires public auth)
