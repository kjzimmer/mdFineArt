import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import type { Gallery, SiteConfig, Work, Event, ClassOffering, Prisma } from '@prisma/client';
import { escapeHtml } from '../lib/html';
import { requestHostname } from '../middleware/gallery';

// Server-rendered "story" content for public routes. The gallery's story (bio, statement,
// work/event/class descriptions, commission pitch) is server-known data — not client-computed
// UI — so instead of rendering the React app for crawlers (headless browser, bot-detection,
// cloaking risk), we render the *content* into the initial HTML for every request, for every
// visitor. React mounts and replaces it immediately for real users (ReactDOM.createRoot fully
// replaces #root's children, no hydration mismatch). See docs/wip/gallery-discoverability.md.
//
// IMPORTANT: this is a second, independent implementation of "how to display this gallery's
// data" — it is NOT derived from the React page components. If About.tsx, Commission.tsx,
// Events.tsx, Classes.tsx, or Gallery.tsx change what they show, this file needs a matching
// update or the two will drift apart.

export interface RenderedPage {
  title: string;
  description: string;
  image: string | null;
  bodyHtml: string;
}

interface AboutShow { year: number; name: string; location: string; }
interface AboutAward { year: number; award: string; event: string; location: string; }
interface AboutMedia { year: number; title: string; }
interface AboutGallery { year: number; name: string; location: string; }

function jsonArray<T>(value: Prisma.JsonValue): T[] {
  return Array.isArray(value) ? (value as unknown as T[]) : [];
}

function paragraphs(items: string[]): string {
  return items.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}

function listSection(heading: string, items: string[]): string {
  if (items.length === 0) return '';
  return `<section><h2>${escapeHtml(heading)}</h2><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></section>`;
}

// ─── Per-route content ──────────────────────────────────────────────────────

export function renderHome(gallery: Gallery, config: SiteConfig, featuredWorks: Work[]): RenderedPage {
  const title = escapeHtml(config.taglinePrimary ? `${gallery.name} — ${config.taglinePrimary}` : gallery.name);
  const description = escapeHtml(config.metaDescription || config.taglineSecondary || `${gallery.name} — fine art gallery.`);
  const image = config.heroImageUrl || config.ogImageUrl || config.logoUrl || null;

  const parts: string[] = [`<h1>${escapeHtml(gallery.name)}</h1>`];
  if (config.taglinePrimary) parts.push(`<p>${escapeHtml(config.taglinePrimary)}</p>`);
  if (config.taglineSecondary) parts.push(`<p>${escapeHtml(config.taglineSecondary)}</p>`);
  if (config.aboutBio.length > 0) {
    parts.push(`<section><h2>About</h2>${paragraphs(config.aboutBio.slice(0, 1))}<p><a href="/about">Read more</a></p></section>`);
  }
  if (featuredWorks.length > 0) {
    const items = featuredWorks.map((w) =>
      `<li><a href="/gallery/${escapeHtml(w.slug)}">${escapeHtml(w.title)}</a>${w.medium ? ` — ${escapeHtml(w.medium)}` : ''}</li>`
    ).join('');
    parts.push(`<section><h2>Featured Works</h2><ul>${items}</ul></section>`);
  }

  return { title, description, image, bodyHtml: parts.join('\n') };
}

export function renderGalleryIndex(gallery: Gallery, config: SiteConfig, works: Work[]): RenderedPage {
  const label = config.worksLabel || 'Gallery';
  const title = escapeHtml(`${label} — ${gallery.name}`);
  const description = escapeHtml(`Browse ${works.length} work${works.length === 1 ? '' : 's'} by ${gallery.name}.`);
  const image = works[0]?.imageUrl || config.heroImageUrl || null;

  const items = works.map((w) => {
    const meta = [w.dimensions, w.medium].filter(Boolean).join(' · ');
    const price = config.showPrice && w.price ? ` — $${w.price.toLocaleString()}` : '';
    return `<li>
      <h3><a href="/gallery/${escapeHtml(w.slug)}">${escapeHtml(w.title)}</a></h3>
      ${meta ? `<p>${escapeHtml(meta)}</p>` : ''}
      ${w.description ? `<p>${escapeHtml(w.description)}</p>` : ''}
      <p>${escapeHtml(w.status)}${price}</p>
    </li>`;
  }).join('\n');

  return { title, description, image, bodyHtml: `<h1>${escapeHtml(label)}</h1><ul>${items}</ul>` };
}

export function renderWorkDetail(gallery: Gallery, config: SiteConfig, work: Work): RenderedPage {
  const title = escapeHtml(`${work.title} — ${gallery.name}`);
  const meta = [work.dimensions, work.medium].filter(Boolean).join(' · ');
  const description = escapeHtml(meta || `View this piece by ${gallery.name}.`);
  const price = config.showPrice && work.price ? `<p>$${work.price.toLocaleString()}</p>` : '';

  const bodyHtml = `<h1>${escapeHtml(work.title)}</h1>
    ${meta ? `<p>${escapeHtml(meta)}</p>` : ''}
    ${work.description ? `<p>${escapeHtml(work.description)}</p>` : ''}
    ${price}
    <p>${escapeHtml(work.status)}</p>
    <p><a href="/gallery">View more works by ${escapeHtml(gallery.name)}</a></p>`;

  return { title, description, image: work.imageUrl, bodyHtml };
}

export function renderAbout(gallery: Gallery, config: SiteConfig): RenderedPage {
  const displayName = config.aboutName || gallery.name;
  const title = escapeHtml(`About ${displayName}`);
  const description = escapeHtml(config.aboutBioSubtitle || config.metaDescription || `Learn about ${displayName}.`);
  const image = config.profileImageUrl || config.aboutStatImage1Url || null;

  const shows = jsonArray<AboutShow>(config.aboutShows);
  const awards = jsonArray<AboutAward>(config.aboutAwards);
  const media = jsonArray<AboutMedia>(config.aboutMedia);
  const galleries = jsonArray<AboutGallery>(config.aboutGalleries);

  const parts: string[] = [`<h1>${escapeHtml(displayName)}</h1>`];
  if (config.aboutBioSubtitle) parts.push(`<p>${escapeHtml(config.aboutBioSubtitle)}</p>`);
  if (config.aboutBio.length) parts.push(`<section><h2>Bio</h2>${paragraphs(config.aboutBio)}</section>`);
  if (config.aboutStatement.length) {
    const subtitle = config.aboutStatSubtitle ? `<p>${escapeHtml(config.aboutStatSubtitle)}</p>` : '';
    parts.push(`<section><h2>Artist Statement</h2>${subtitle}${paragraphs(config.aboutStatement)}</section>`);
  }
  parts.push(listSection('Shows', shows.map((s) => `${s.name}, ${s.location} (${s.year})`)));
  parts.push(listSection('Awards', awards.map((a) => `${a.award} — ${a.event}, ${a.location} (${a.year})`)));
  parts.push(listSection('In the Media', media.map((m) => `${m.title} (${m.year})`)));
  parts.push(listSection('Past Galleries', galleries.map((g) => `${g.name}, ${g.location} (${g.year})`)));

  return { title, description, image, bodyHtml: parts.filter(Boolean).join('\n') };
}

export function renderCommission(gallery: Gallery, config: SiteConfig): RenderedPage {
  const heading = config.commissionTitle || 'Commission';
  const title = escapeHtml(`${heading} — ${gallery.name}`);

  if (!config.commissionsEnabled) {
    return {
      title,
      description: escapeHtml(`${gallery.name} is not currently accepting commissions.`),
      image: null,
      bodyHtml: `<h1>Commission</h1><p>${escapeHtml(gallery.name)} is not currently accepting new commission inquiries.</p>`,
    };
  }

  const description = escapeHtml(config.commissionBody[0] || `Commission a custom piece from ${gallery.name}.`);
  const bodyHtml = `<h1>${escapeHtml(heading)}</h1>${paragraphs(config.commissionBody)}`;
  return { title, description, image: config.heroImageUrl || null, bodyHtml };
}

export function renderEvents(gallery: Gallery, events: Event[]): RenderedPage {
  const title = escapeHtml(`Events — ${gallery.name}`);
  const description = escapeHtml(`Upcoming events and exhibitions from ${gallery.name}.`);

  if (events.length === 0) {
    return { title, description, image: null, bodyHtml: '<h1>Events</h1><p>No events currently scheduled.</p>' };
  }

  const items = events.map((ev) => `<li>
    <h3>${escapeHtml(ev.title)}</h3>
    <p>${ev.date.toISOString().slice(0, 10)}${ev.time ? ` · ${escapeHtml(ev.time)}` : ''} — ${escapeHtml(ev.venue)}</p>
    ${ev.description ? `<p>${escapeHtml(ev.description)}</p>` : ''}
  </li>`).join('\n');

  return { title, description, image: events.find((e) => e.imageUrl)?.imageUrl ?? null, bodyHtml: `<h1>Events</h1><ul>${items}</ul>` };
}

export function renderClasses(gallery: Gallery, config: SiteConfig, offerings: ClassOffering[]): RenderedPage {
  const label = config.classesLabel || 'Classes & Workshops';
  const heading = config.classesHeading || label;
  const title = escapeHtml(`${label} — ${gallery.name}`);
  const description = escapeHtml(heading !== label ? heading : `Classes and workshops with ${gallery.name}.`);

  if (offerings.length === 0) {
    return { title, description, image: config.classesImageUrl || null, bodyHtml: `<h1>${escapeHtml(heading)}</h1><p>Class information coming soon.</p>` };
  }

  const items = offerings.map((o) => `<li><h3>${escapeHtml(o.heading)}</h3><p>${escapeHtml(o.description)}</p></li>`).join('\n');
  return { title, description, image: config.classesImageUrl || null, bodyHtml: `<h1>${escapeHtml(heading)}</h1><ul>${items}</ul>` };
}

// ─── JSON-LD ─────────────────────────────────────────────────────────────

// Reuses requestHostname — the same X-Gallery-Hostname-aware resolution used to look up
// which gallery this request is for — so public URLs always match whichever domain the
// visitor is actually on (preview or custom), never a different one preferred from the DB
// record. Deliberately NOT gallery.customDomain/previewDomain: that would make every response
// claim the gallery's "primary" domain regardless of which one was actually being browsed,
// silently breaking the preview domain once a custom domain is also configured.
export function canonicalBaseUrl(req: Request): string {
  return `${req.protocol}://${requestHostname(req)}`;
}

export function gallerySchema(gallery: Gallery, config: SiteConfig, req: Request): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ArtGallery',
    name: gallery.name,
    url: canonicalBaseUrl(req),
    description: config.metaDescription || config.taglineSecondary || undefined,
    image: config.logoUrl || config.heroImageUrl || undefined,
  };
}

export function workSchema(gallery: Gallery, config: SiteConfig, work: Work, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: work.title,
    url,
    image: work.imageUrl,
    description: work.description || [work.dimensions, work.medium].filter(Boolean).join(' · ') || undefined,
    artMedium: work.medium || undefined,
    artform: work.subject || undefined,
    width: work.dimensions || undefined,
    creator: { '@type': 'Person', name: config.aboutName || gallery.name },
  };
}

export function personSchema(config: SiteConfig): Record<string, unknown> | null {
  if (!config.aboutName) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: config.aboutName,
    description: config.aboutBio[0] || undefined,
    image: config.profileImageUrl || undefined,
  };
}

function safeJsonLd(data: unknown): string {
  // Neutralize "</script>" breakout in any admin-provided string field.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// ─── Template injection + send ─────────────────────────────────────────────

// Crawl-nav: link-following crawlers (not all of them read /sitemap.xml) need a way to
// discover other pages from any single page, since the real site's TopNav/Footer are React
// components rendered client-side, not part of this content shell. Mirrors TopNav.tsx's exact
// gating (same config flags, same order) so it stays honest about which sections actually
// exist for this gallery — update both together if TopNav's nav items ever change.
function renderNav(gallery: Gallery, config: SiteConfig): string {
  const links: { href: string; label: string }[] = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/gallery', label: config.worksLabel || 'Gallery' },
  ];
  if (config.eventsEnabled) links.push({ href: '/events', label: 'Events' });
  if (config.musicEnabled) links.push({ href: '/music', label: 'Music' });
  if (config.classesEnabled) links.push({ href: '/classes', label: config.classesLabel || 'Classes' });
  if (config.blogEnabled) links.push({ href: '/blog', label: 'Blog' });
  if (config.commissionsEnabled) links.push({ href: '/commission', label: config.commissionTitle || 'Commissions' });

  const items = links.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('');
  return `<nav aria-label="Site"><h2>More from ${escapeHtml(gallery.name)}</h2><ul>${items}</ul></nav>`;
}

function buildMetaTags(page: RenderedPage, url: string, siteName: string): string {
  const image = page.image ? escapeHtml(page.image) : '';
  return `<title>${page.title}</title>
    <meta name="description" content="${page.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${page.title}" />
    <meta name="twitter:description" content="${page.description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ''}`;
}

function injectSsrContent(template: string, page: RenderedPage, url: string, siteName: string, jsonLd?: unknown): string {
  const jsonLdTag = jsonLd ? `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>` : '';
  let html = template.replace('<title>Gallery</title>', `${buildMetaTags(page, url, siteName)}\n${jsonLdTag}`);
  html = html.replace('<div id="root"></div>', `<div id="root">${page.bodyHtml}</div>`);
  return html;
}

// ─── Sitemap / robots ───────────────────────────────────────────────────────

export function renderSitemap(baseUrl: string, config: SiteConfig, workSlugs: string[]): string {
  const urls = ['/', '/gallery', ...workSlugs.map((s) => `/gallery/${s}`), '/about'];
  if (config.commissionsEnabled) urls.push('/commission');
  if (config.eventsEnabled) urls.push('/events');
  if (config.classesEnabled) urls.push('/classes');

  const entries = urls.map((u) => `  <url><loc>${escapeHtml(baseUrl + u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export function renderRobots(baseUrl: string): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /app-admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

export function sendSsrPage(
  res: Response,
  req: Request,
  clientDist: string,
  page: RenderedPage,
  gallery: Gallery,
  config: SiteConfig,
  jsonLd?: unknown,
): void {
  const template = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
  const url = `${canonicalBaseUrl(req)}${req.originalUrl}`;
  const pageWithNav: RenderedPage = { ...page, bodyHtml: `${page.bodyHtml}\n${renderNav(gallery, config)}` };
  res.set('Cache-Control', 'no-store'); // reflects live gallery data
  res.send(injectSsrContent(template, pageWithNav, url, gallery.name, jsonLd));
}
