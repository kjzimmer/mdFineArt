import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// First-pass feature inventory for subscription-tier planning. Drawn from CLAUDE.md's
// "Current State" (shipped) and docs/ROADMAP.md's Phase 3 candidates + Parking Lot (roadmap).
// The "Core Platform" category is baseline functionality included in every plan regardless of
// tier — listed here (not omitted) since the API needs to describe the whole product for the
// marketing site, not just the tier-gated add-ons; once SubscriptionTier exists these would
// simply all be assigned to the lowest tier rather than living outside the model. Deliberately
// still excludes internal/platform-ops items that aren't gallery-owner-facing at all (NS
// verification status, Anthropic usage tracking, self-service onboarding, R2 restructure,
// bug-fix-shaped Gray Area items). This is a draft for review, not a final list — categories
// and inclusion are a judgment call, not a settled taxonomy.
//
// Usage: npx tsx src/scripts/seed-features.ts
const features: {
  key: string;
  name: string;
  customerDescription?: string;
  internalNote?: string;
  status: 'shipped' | 'roadmap';
  category: string;
  sortOrder: number;
}[] = [
  // ── Core Platform (included in every plan) ──────────────────────────────
  {
    key: 'public_gallery',
    name: 'Public Gallery & Portfolio',
    customerDescription: 'A beautiful, responsive portfolio of your work with filtering and a full-screen viewer.',
    status: 'shipped',
    category: 'Core Platform',
    sortOrder: 1,
  },
  {
    key: 'work_management',
    name: 'Work Management',
    customerDescription: 'Add, edit, and organize your works with automatic image optimization, watermarking, and print-size detection.',
    internalNote: 'Admin Works CRUD, bulk upload, sharp-based processing pipeline.',
    status: 'shipped',
    category: 'Core Platform',
    sortOrder: 2,
  },
  {
    key: 'about_page',
    name: 'About Page',
    customerDescription: 'Tell your story — bio, artist statement, shows, awards, media mentions, and past galleries.',
    status: 'shipped',
    category: 'Core Platform',
    sortOrder: 3,
  },
  {
    key: 'contact_inbox',
    name: 'Contact Form & Inbox',
    customerDescription: 'A public contact form with all messages organized in your admin inbox.',
    status: 'shipped',
    category: 'Core Platform',
    sortOrder: 4,
  },
  {
    key: 'crm',
    name: 'Client Records',
    customerDescription: 'Every inquiry and collector automatically tracked with full activity history.',
    internalNote: 'People/CRM tab — Person model, activity history across contacts/commissions/orders.',
    status: 'shipped',
    category: 'Core Platform',
    sortOrder: 5,
  },
  {
    key: 'admin_dashboard',
    name: 'Secure Admin Dashboard',
    customerDescription: 'A private, password-protected dashboard to manage every part of your gallery site.',
    internalNote: 'Auth (bcrypt + JWT + refresh cookie) and the Configuration panel that drives all site content.',
    status: 'shipped',
    category: 'Core Platform',
    sortOrder: 6,
  },

  // ── Content & Presentation ──────────────────────────────────────────────
  {
    key: 'featured_works',
    name: 'Featured Works',
    customerDescription: 'Highlight your best pieces on the landing page.',
    status: 'shipped',
    category: 'Content & Presentation',
    sortOrder: 10,
  },
  {
    key: 'works_in_progress',
    name: 'Works in Progress',
    customerDescription: 'Share your creative process — let visitors follow a piece as you paint it, from first photo to finished work.',
    internalNote: 'SiteConfig.worksInProgressEnabled; Home page section + DigitalAsset/AssetLinkage. Shipped 2026-08-10.',
    status: 'shipped',
    category: 'Content & Presentation',
    sortOrder: 20,
  },
  {
    key: 'reference_library',
    name: 'Reference Library',
    customerDescription: 'A private, reusable photo library for reference material used across multiple works.',
    internalNote: 'SiteConfig.referenceLibraryEnabled; admin-only, no public surface. Shipped 2026-08-10.',
    status: 'shipped',
    category: 'Content & Presentation',
    sortOrder: 30,
  },
  {
    key: 'site_themes',
    name: 'Site Themes',
    customerDescription: 'Choose from several curated visual themes to match your gallery’s style.',
    internalNote: '5-6 CSS-token themes today (dark-western, prairie-gold, white-cube, morning-wash, studio-precision, raw-material).',
    status: 'shipped',
    category: 'Content & Presentation',
    sortOrder: 40,
  },
  {
    key: 'custom_pages',
    name: 'Custom Pages',
    customerDescription: 'Create your own nav pages with rich text and images for anything not covered by a built-in page type.',
    internalNote: 'ROADMAP.md Parking Lot. Would also cover Music once real, without a dedicated Music feature.',
    status: 'roadmap',
    category: 'Content & Presentation',
    sortOrder: 50,
  },
  {
    key: 'blog',
    name: 'Blog',
    customerDescription: 'Publish blog posts to share news, stories, and studio updates.',
    internalNote: 'Nav-only stub exists today (musicEnabled/blogEnabled toggle both stub the same way); no real backend yet. ROADMAP.md Parking Lot.',
    status: 'roadmap',
    category: 'Content & Presentation',
    sortOrder: 60,
  },
  {
    key: 'advanced_styling',
    name: 'Advanced Styling & Layout',
    customerDescription: 'Deeper layout and styling control beyond the built-in themes.',
    internalNote: 'ROADMAP.md Phase 3 candidate.',
    status: 'roadmap',
    category: 'Content & Presentation',
    sortOrder: 70,
  },
  {
    key: 'theme_marketplace',
    name: 'Expanded Theme System',
    customerDescription: 'A wider selection of visual themes as the platform grows.',
    internalNote: 'ROADMAP.md Phase 5 — shell + theme npm packages, see docs/wip/theme-architecture.md.',
    status: 'roadmap',
    category: 'Content & Presentation',
    sortOrder: 80,
  },

  // ── Audience & Engagement ───────────────────────────────────────────────
  {
    key: 'events',
    name: 'Events',
    customerDescription: 'List upcoming shows, openings, and appearances.',
    status: 'shipped',
    category: 'Audience & Engagement',
    sortOrder: 110,
  },
  {
    key: 'classes',
    name: 'Classes & Workshops',
    customerDescription: 'Offer classes and workshops with an inquiry form for interested students.',
    status: 'shipped',
    category: 'Audience & Engagement',
    sortOrder: 120,
  },
  {
    key: 'newsletter',
    name: 'Newsletter Signup',
    customerDescription: 'Collect visitor emails with a newsletter signup card on your homepage.',
    internalNote: 'Subscriber list + signup card only today — no authoring/send capability yet (see newsletter_authoring).',
    status: 'shipped',
    category: 'Audience & Engagement',
    sortOrder: 130,
  },
  {
    key: 'commissions',
    name: 'Commission Requests',
    customerDescription: 'Accept and manage custom commission inquiries from collectors.',
    status: 'shipped',
    category: 'Audience & Engagement',
    sortOrder: 140,
  },
  {
    key: 'work_sharing',
    name: 'Work Sharing',
    customerDescription: 'A share button on every piece that generates a rich link preview for social media and messaging.',
    status: 'shipped',
    category: 'Audience & Engagement',
    sortOrder: 150,
  },
  {
    key: 'classes_booking',
    name: 'Class Registration & Booking',
    customerDescription: 'Let students register and pay for a specific class or session, not just inquire.',
    internalNote: 'ROADMAP.md Phase 3 candidate, on top of existing simple offering-list Classes.',
    status: 'roadmap',
    category: 'Audience & Engagement',
    sortOrder: 160,
  },
  {
    key: 'newsletter_authoring',
    name: 'Newsletter Authoring',
    customerDescription: 'Compose and send newsletters to your subscriber list, with history.',
    internalNote: 'ROADMAP.md Parking Lot — today’s Newsletter feature is subscriber-list-only.',
    status: 'roadmap',
    category: 'Audience & Engagement',
    sortOrder: 170,
  },
  {
    key: 'inbox_messaging',
    name: 'In-Platform Customer Conversation',
    customerDescription: 'Reply to collector inquiries and track the full conversation without leaving the app.',
    internalNote: 'ROADMAP.md Parking Lot; overlaps CLAUDE.md Gray Area #8 (Inbox threading).',
    status: 'roadmap',
    category: 'Audience & Engagement',
    sortOrder: 180,
  },
  {
    key: 'work_detail_page',
    name: 'Dedicated Work Page',
    customerDescription: 'A polished, distraction-free page for a single piece, richer than a shared gallery link.',
    internalNote: 'ROADMAP.md Parking Lot, expands on the current deep-link share button.',
    status: 'roadmap',
    category: 'Audience & Engagement',
    sortOrder: 190,
  },

  // ── Commerce ─────────────────────────────────────────────────────────────
  {
    key: 'commerce_invoicing',
    name: 'Invoicing & Payments',
    customerDescription: 'Turn inquiries into invoices and accept card payments online.',
    internalNote: 'Square integration, full inquiry -> invoice -> payment flow.',
    status: 'shipped',
    category: 'Commerce',
    sortOrder: 210,
  },
  {
    key: 'invoice_history',
    name: 'Invoice History & Detail',
    customerDescription: 'A detailed record of what a collector purchased, visible on paid invoices and in their profile.',
    internalNote: 'ROADMAP.md Parking Lot — paid invoices currently show only a "Payment received" banner.',
    status: 'roadmap',
    category: 'Commerce',
    sortOrder: 220,
  },
  {
    key: 'advanced_commerce',
    name: 'Cart & Self-Serve Checkout',
    customerDescription: 'Let collectors browse prints and check out themselves, without an inquiry step.',
    internalNote: 'ROADMAP.md Phase 5 — cart/checkout, print SKU catalog, recurring billing.',
    status: 'roadmap',
    category: 'Commerce',
    sortOrder: 230,
  },
  {
    key: 'accounting_integration',
    name: 'Accounting Integration',
    customerDescription: 'Connect sales data to your accounting software.',
    internalNote: 'ROADMAP.md Phase 5, API TBD.',
    status: 'roadmap',
    category: 'Commerce',
    sortOrder: 240,
  },

  // ── Marketing & Discoverability ──────────────────────────────────────────
  {
    key: 'ai_discoverability',
    name: 'AI & Search Discoverability',
    customerDescription: 'Your gallery’s story is automatically made visible to AI answer engines and search crawlers, no setup required.',
    internalNote: 'Always-on today, not currently gated by a toggle. storyContent.ts SSR, sitemap, JSON-LD.',
    status: 'shipped',
    category: 'Marketing & Discoverability',
    sortOrder: 310,
  },
  {
    key: 'custom_domain',
    name: 'Custom Domain',
    customerDescription: 'Use your own domain name instead of a mygalleryworks.com subdomain.',
    internalNote: 'Cloudflare Worker + NS transfer routing. Classic tier-gating candidate.',
    status: 'shipped',
    category: 'Marketing & Discoverability',
    sortOrder: 320,
  },
  {
    key: 'analytics',
    name: 'Traffic Analytics',
    customerDescription: 'See visitor counts, page views, and trends for your gallery site.',
    status: 'shipped',
    category: 'Marketing & Discoverability',
    sortOrder: 330,
  },
  {
    key: 'ai_gallery_review',
    name: 'AI Gallery Review',
    customerDescription: 'Get AI-generated coaching on how well your gallery tells its story — what to add, what’s thin.',
    internalNote: 'ROADMAP.md Parking Lot, paused next-task as of 2026-08-12. Content coaching, not a pass/fail score — see project_ai_gallery_review_intent memory.',
    status: 'roadmap',
    category: 'Marketing & Discoverability',
    sortOrder: 340,
  },
  {
    key: 'visitor_tracking',
    name: 'Visitor Tracking',
    customerDescription: 'Anonymous visitor tracking with consent, beyond aggregate traffic analytics.',
    internalNote: 'ROADMAP.md Phase 5, spec at docs/VISITOR_TRACKING_SPEC.md.',
    status: 'roadmap',
    category: 'Marketing & Discoverability',
    sortOrder: 350,
  },

  // ── AI Assistance ────────────────────────────────────────────────────────
  {
    key: 'admin_ai_assistant',
    name: 'Admin AI Assistant',
    customerDescription: 'A built-in AI chat that helps you use the platform, answers how-to questions, and captures feedback.',
    internalNote: 'Currently ungated/universal for every gallery — worth deciding whether this stays that way or becomes tiered.',
    status: 'shipped',
    category: 'AI Assistance',
    sortOrder: 410,
  },
  {
    key: 'ai_admin_agent',
    name: 'AI Admin Agent (actions)',
    customerDescription: 'An AI assistant that knows your gallery’s own data and can take actions on your behalf.',
    internalNote: 'ROADMAP.md Parking Lot — expands the current read-only, app-knowledge-only admin assistant.',
    status: 'roadmap',
    category: 'AI Assistance',
    sortOrder: 420,
  },
  {
    key: 'ai_business_owner',
    name: 'AI Business Team (owner)',
    customerDescription: 'AI help with writing, inquiry responses, social content, and business insights.',
    internalNote: 'ROADMAP.md Phase 5.',
    status: 'roadmap',
    category: 'AI Assistance',
    sortOrder: 430,
  },
  {
    key: 'ai_visitor_chat',
    name: 'AI Visitor Chat',
    customerDescription: 'An AI chat widget on your public site that answers visitor questions from your gallery’s own content.',
    internalNote: 'ROADMAP.md Parking Lot, shelved after early feedback (high-end visitors expect personal interaction) — likely opt-in per gallery if ever revisited, not a default.',
    status: 'roadmap',
    category: 'AI Assistance',
    sortOrder: 440,
  },
  {
    key: 'ai_business_visitor',
    name: 'AI Business Team (visitors)',
    customerDescription: 'Personalized recommendations and collector engagement powered by AI.',
    internalNote: 'ROADMAP.md Phase 5.',
    status: 'roadmap',
    category: 'AI Assistance',
    sortOrder: 450,
  },

  // ── Team & Operations ────────────────────────────────────────────────────
  {
    key: 'team_management',
    name: 'Team Member Management',
    customerDescription: 'Invite additional team members to help manage your gallery admin.',
    internalNote: 'ROADMAP.md Phase 3 candidate / Parking Lot #5 — today only app admin can add gallery members.',
    status: 'roadmap',
    category: 'Team & Operations',
    sortOrder: 510,
  },
];

async function main() {
  console.log(`Seeding ${features.length} features...`);
  for (const feature of features) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      update: feature,
      create: feature,
    });
  }
  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
