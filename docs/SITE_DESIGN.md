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

## Pages

### Home (`/`)

**Hero**
- Full-bleed painting image (one of Melody's flagship works, admin-selectable)
- Overlay text: "Painter of the West and Its Wild" in display font
- Two CTAs: "View Gallery" and "Commission a Painting"

**Featured Works**
- Grid of 6 paintings with `featured: true`
- Each card: image, title, price or SOLD badge
- Click → lightbox (same as gallery)

**About Strip**
- Short bio excerpt (2–3 sentences)
- Studio photo
- Link: "Read the Full Story"
- Studio location: "Westcliffe, CO — Open by Appointment"

**Memberships / Awards**
- CGA Pro Member logo
- WAOW Associate Member badge
- Any major award callouts

**Newsletter Signup Strip**
- "Stay close to the wild — join Melody's collector list"
- Email input + subscribe button

---

### Gallery (`/gallery`)

**Layout**
- Uniform grid: 4 col desktop / 3 col tablet / 2 col mobile
- Default sort: featured first, then newest (`sortOrder` then `createdAt` desc)

**Filter Bar**
- Subject: All | Mustangs | Wildlife | Landscape | Equine | Portrait
- Status: All | Available | Sold
- Filters persist in URL params for shareability

**Painting Card**
- Image (aspect ratio preserved, object-fit cover)
- Title (display font)
- Dimensions + medium (muted)
- Price or "SOLD" badge
- Hover: subtle scale + accent border

**Lightbox Modal**
- Triggered on card click
- Full-size image (left 60%)
- Right panel: title, dimensions, medium, year, subject tags, awards, price, description, story
- Action buttons: "Add to Cart" / "Buy Print" / "Inquire"
- Keyboard nav: ← → to browse paintings, Esc to close
- Smooth open/close animation

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
