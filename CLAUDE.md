# CLAUDE.md — Melody DeBenedictis Artist Website

> For site design, page layouts, features, and visual spec, see `SITE_DESIGN.md`.

---

## Project Overview

Full rebuild of melodydebenedictis.com — a fine art portfolio and e-commerce site for Western oil painter
Melody DeBenedictis. React + TypeScript + PostgreSQL with Square payments and an admin dashboard.

**Live reference (Weebly original):** https://www.melodydebenedictis.com/

---

## Tech Stack

| Layer          | Choice                          | Notes                              |
|----------------|---------------------------------|------------------------------------|
| Frontend       | React 18 + TypeScript           | Vite for bundling                  |
| Styling        | Tailwind CSS                    | Design tokens in SITE_DESIGN.md    |
| Backend        | Node.js + Express (TypeScript)  | REST API                           |
| Database       | PostgreSQL                      | via Prisma ORM                     |
| Payments       | Square Web Payments SDK         | Originals + prints checkout        |
| Auth           | JWT + bcrypt                    | Admin only; no public login        |
| Email          | Resend (or SendGrid)            | Forms, newsletter, order receipts  |
| Image storage  | Cloudflare R2 (S3-compatible)   | Painting images, hi-res assets     |
| Hosting        | Railway or Render               | Full-stack + Postgres add-on       |
| Version control| GitHub                          | main + dev branches, PR workflow   |

---

## Repository Structure

```
melody-site/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Navbar, Footer, PageWrapper
│   │   │   ├── gallery/           # GalleryGrid, PaintingCard, LightboxModal
│   │   │   ├── shop/              # Cart, CartDrawer, CheckoutForm
│   │   │   ├── admin/             # All admin panel components
│   │   │   ├── forms/             # CommissionForm, ContactForm, NewsletterSignup
│   │   │   ├── events/            # EventCard, EventRegistrationModal
│   │   │   └── blog/              # PostCard, PostBody
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── PaintingDetail.tsx
│   │   │   ├── Exhibitions.tsx
│   │   │   ├── Music.tsx
│   │   │   ├── Archives.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── BlogPost.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Commission.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.tsx
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── AdminPaintings.tsx
│   │   │       ├── AdminOrders.tsx
│   │   │       ├── AdminEvents.tsx
│   │   │       ├── AdminBlog.tsx
│   │   │       └── AdminNewsletter.tsx
│   │   ├── hooks/                 # useCart, useAuth, useGallery
│   │   ├── context/               # CartContext, AuthContext
│   │   ├── lib/                   # api.ts (axios client), square.ts, utils.ts
│   │   └── types/                 # Shared TypeScript types
│   └── public/
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── paintings.ts
│   │   │   ├── orders.ts
│   │   │   ├── commissions.ts
│   │   │   ├── events.ts
│   │   │   ├── blog.ts
│   │   │   ├── newsletter.ts
│   │   │   ├── contact.ts
│   │   │   ├── uploads.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification
│   │   │   └── upload.ts          # Multer + R2 upload
│   │   ├── lib/
│   │   │   ├── square.ts          # Square SDK wrapper
│   │   │   ├── email.ts           # Resend/SendGrid wrapper
│   │   │   └── prisma.ts          # Prisma client singleton
│   │   └── index.ts
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts                # Seed existing paintings from Weebly
│
├── .env.example
├── CLAUDE.md                      # ← this file (stable instructions)
├── SITE_DESIGN.md                 # page layouts, features, design spec (update freely)
└── README.md
```

---

## Database Schema (Prisma)

```prisma
model Painting {
  id              String         @id @default(cuid())
  title           String
  slug            String         @unique
  description     String?
  story           String?        // "story behind the painting" — longer collector text
  imageUrl        String
  thumbUrl        String?
  width           Float          // inches
  height          Float          // inches
  medium          String         @default("Oil on gallery wrap canvas")
  subject         Subject[]
  year            Int?
  priceOriginal   Float?         // null if sold/NFS
  status          Status         @default(AVAILABLE)
  featured        Boolean        @default(false)
  sortOrder       Int            @default(0)
  awards          String[]
  printsAvailable Boolean        @default(false)
  printProducts   PrintProduct[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model PrintProduct {
  id                String   @id @default(cuid())
  paintingId        String
  painting          Painting @relation(fields: [paintingId], references: [id])
  type              PrintType
  size              String
  price             Float
  squareItemId      String?
  squareVariationId String?
}

model Order {
  id              String      @id @default(cuid())
  squareOrderId   String?     @unique
  paymentId       String?
  status          OrderStatus @default(PENDING)
  customerName    String
  customerEmail   String
  items           OrderItem[]
  subtotal        Float
  tax             Float
  total           Float
  shippingAddress Json?
  notes           String?
  createdAt       DateTime    @default(now())
}

model OrderItem {
  id             String  @id @default(cuid())
  orderId        String
  order          Order   @relation(fields: [orderId], references: [id])
  paintingId     String?
  printProductId String?
  label          String
  price          Float
  quantity       Int     @default(1)
}

model CommissionRequest {
  id          String           @id @default(cuid())
  name        String
  email       String
  phone       String?
  subject     String
  size        String
  budget      Float?
  deadline    String?
  description String
  refImages   String[]
  status      CommissionStatus @default(NEW)
  adminNotes  String?
  createdAt   DateTime         @default(now())
}

model Event {
  id               String              @id @default(cuid())
  title            String
  description      String
  startDate        DateTime
  endDate          DateTime?
  location         String
  address          String?
  imageUrl         String?
  registrationOpen Boolean             @default(false)
  capacity         Int?
  registrations    EventRegistration[]
  published        Boolean             @default(false)
  createdAt        DateTime            @default(now())
}

model EventRegistration {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  name      String
  email     String
  guests    Int      @default(1)
  createdAt DateTime @default(now())
}

model BlogPost {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  excerpt     String?
  body        String
  coverImage  String?
  tags        String[]
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model NewsletterSubscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  active    Boolean  @default(true)
  source    String?
  createdAt DateTime @default(now())
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  subject   String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

enum Status           { AVAILABLE SOLD RESERVED NFS }
enum PrintType        { PAPER CANVAS }
enum OrderStatus      { PENDING PAID SHIPPED FULFILLED REFUNDED CANCELLED }
enum CommissionStatus { NEW REVIEWING QUOTED ACCEPTED IN_PROGRESS COMPLETE DECLINED }
enum Subject          { MUSTANG WILDLIFE LANDSCAPE EQUINE PORTRAIT }
```

---

## API Routes

```
# Paintings
GET    /api/paintings                  # list (filters: subject, status, featured)
GET    /api/paintings/:slug            # single painting
POST   /api/paintings                  # [admin] create
PUT    /api/paintings/:id              # [admin] update
DELETE /api/paintings/:id              # [admin] delete
PATCH  /api/paintings/reorder          # [admin] update sortOrder

# Orders
POST   /api/orders/checkout            # create order + Square payment
GET    /api/orders                     # [admin] list
GET    /api/orders/:id                 # [admin] detail
PATCH  /api/orders/:id/status          # [admin] update status

# Commissions
POST   /api/commissions                # submit request
GET    /api/commissions                # [admin] list
GET    /api/commissions/:id            # [admin] detail
PATCH  /api/commissions/:id            # [admin] update status/notes

# Events
GET    /api/events                     # published events
POST   /api/events                     # [admin] create
PUT    /api/events/:id                 # [admin] update
DELETE /api/events/:id                 # [admin] delete
POST   /api/events/:id/register        # public registration
GET    /api/events/:id/registrations   # [admin]

# Blog
GET    /api/blog                       # published posts
GET    /api/blog/:slug                 # single post
POST   /api/blog                       # [admin] create
PUT    /api/blog/:id                   # [admin] update
DELETE /api/blog/:id                   # [admin] delete

# Newsletter
POST   /api/newsletter/subscribe       # public subscribe
DELETE /api/newsletter/unsubscribe     # via token
GET    /api/newsletter/subscribers     # [admin]
POST   /api/newsletter/send            # [admin] broadcast

# Contact
POST   /api/contact                    # submit message
GET    /api/contact                    # [admin] list
PATCH  /api/contact/:id/read           # [admin] mark read

# Auth
POST   /api/auth/login                 # admin login → JWT
POST   /api/auth/refresh               # refresh token

# Uploads
POST   /api/uploads/image              # [admin] painting image → R2
POST   /api/uploads/reference          # commission reference images
```

---

## Square Integration

```
SQUARE_ACCESS_TOKEN=        # Production token
SQUARE_LOCATION_ID=
SQUARE_WEBHOOK_SECRET=
VITE_SQUARE_APP_ID=         # Frontend Web Payments SDK
VITE_SQUARE_LOCATION_ID=
```

**Payment flow:**
1. User fills cart → checkout page
2. Square Web Payments SDK renders card form
3. `card.tokenize()` → payment token sent to server
4. Server calls `paymentsApi.createPayment()` with token
5. Success → create Order in DB, send receipt email, return order ID
6. Frontend → `/order-confirmation/:id`

**Webhooks:** `payment.completed` → PAID; `payment.failed` → notify admin

---

## Environment Variables

```bash
# server/.env
DATABASE_URL=postgresql://...
JWT_SECRET=
JWT_REFRESH_SECRET=
SQUARE_ACCESS_TOKEN=
SQUARE_LOCATION_ID=
SQUARE_WEBHOOK_SECRET=
RESEND_API_KEY=
FROM_EMAIL=hello@melodydebenedictis.com
ADMIN_EMAIL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# client/.env
VITE_API_URL=http://localhost:3001
VITE_SQUARE_APP_ID=
VITE_SQUARE_LOCATION_ID=
```

---

## Dev Setup

```bash
# Clone and install
git clone https://github.com/YOUR_ORG/melody-site.git
cd melody-site
npm install
cd client && npm install
cd ../server && npm install

# Database
cd server
cp ../.env.example .env       # fill in values
npx prisma migrate dev --name init
npx prisma db seed            # seeds ~60 paintings from Weebly

# Run everything
npm run dev                   # client :5173, server :3001
```

**Key commands:**
```bash
npm run dev
npm run build
npx prisma studio
npx prisma migrate dev --name NAME
npx prisma db seed
```

---

## Coding Conventions

- Components: PascalCase, filename matches component name
- Styling: Tailwind only — no separate CSS files
- Server input validation: zod on every route
- No raw SQL — all DB access through Prisma
- No `any` types — strict TypeScript throughout
- Env vars: accessed only via typed `config.ts` on the server
- Images: `loading="lazy"`, serve WebP from R2 when possible
- Accessibility: keyboard navigable, all images have descriptive alt text

---

## Migration Notes (Weebly → New Site)

Seed all ~60 paintings via `prisma/seed.ts`:
- Parse title, size (e.g. "36x48"), medium, price, sold status from Weebly page
- Download images from Weebly CDN → re-upload to R2
- Manually assign subject tags during seed
- Carry over print products for paintings that had them

Other content: Exhibitions/Awards → BlogPost entries; Events → re-enter in admin

---

## Out of Scope (v1)

- Multi-artist support
- Public user accounts / wishlists
- Auction / bidding
- Automated print fulfillment (Printful etc.)
- Mobile app
