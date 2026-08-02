import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { resolveGallery } from './middleware/gallery';
import { prisma } from './prisma';
import authRouter from './routes/auth';
import worksRouter from './routes/works';
import contactRouter from './routes/contact';
import commissionsRouter from './routes/commissions';
import uploadsRouter from './routes/uploads';
import newsletterRouter from './routes/newsletter';
import peopleRouter from './routes/people';
import ordersRouter from './routes/orders';
import analyticsRouter from './routes/analytics';
import configRouter from './routes/config';
import slidesRouter from './routes/slides';
import socialRouter from './routes/social';
import appAdminRouter from './routes/app-admin';
import squareRouter, { squareCallbackRouter } from './routes/square';
import publicInvoicesRouter from './routes/public-invoices';
import eventsRouter from './routes/events';
import classesRouter from './routes/classes';
import supportRouter from './routes/support';

const app = express();
const port = process.env.PORT || 3001;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

app.set('trust proxy', 1); // Railway/Cloudflare sit behind a proxy

app.use(cors({
  origin: true,  // reflect request origin — required for credentials + ES module asset loading
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/ping', (_req, res) => res.json({ message: 'pong' }));

// Public routes — no gallery context needed, mounted before resolveGallery
app.use('/api/invoices/public', publicInvoicesRouter);
app.use('/api/square/callback', squareCallbackRouter);

// Resolve gallery from Host header before all API routes.
// Local dev: set GALLERY_SLUG=melody in .env to bypass domain lookup.
app.use('/api', resolveGallery);

app.use('/api/auth', authRouter);
app.use('/api/works', worksRouter);
app.use('/api/contact', contactRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/people', peopleRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/config', configRouter);
app.use('/api/slides', slidesRouter);
app.use('/api/social', socialRouter);
app.use('/api/app-admin', appAdminRouter);
app.use('/api/square', squareRouter);
app.use('/api/events', eventsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/support', supportRouter);

// Serve built frontend in production
// __dirname is server/dist/ — go up two levels to reach project root
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  // Shared work links (/gallery/:slug) get server-rendered OG/Twitter meta tags so
  // pasting one into iMessage/Slack/etc shows the work's image and title, not a blank
  // card — the app is otherwise a pure SPA with no per-route HTML. Falls through to the
  // generic shell below if the gallery/work can't be resolved.
  app.get('/gallery/:slug', async (req, res, next) => {
    try {
      const raw = (req.headers['x-gallery-hostname'] as string) || req.hostname;
      const hostname = raw.replace(/^www\./, '');
      const gallery = await prisma.gallery.findFirst({
        where: { OR: [{ customDomain: hostname }, { previewDomain: hostname }] },
      }) ?? (process.env.GALLERY_SLUG
        ? await prisma.gallery.findUnique({ where: { slug: process.env.GALLERY_SLUG } })
        : null);

      const work = gallery
        ? await prisma.work.findFirst({ where: { galleryId: gallery.id, slug: req.params.slug } })
        : null;

      if (!gallery || !work) return next();

      const template = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
      const title = escapeHtml(`${work.title} — ${gallery.name}`);
      const description = escapeHtml([work.dimensions, work.medium].filter(Boolean).join(' · ') || `View this piece by ${gallery.name}.`);
      const image = escapeHtml(work.imageUrl);
      const url = escapeHtml(`${req.protocol}://${req.get('host')}${req.originalUrl}`);

      const metaTags = `<title>${title}</title>
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="${escapeHtml(gallery.name)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;

      res.set('Cache-Control', 'no-store'); // reflects live work data (status/price can change)
      res.send(template.replace('<title>Gallery</title>', metaTags));
    } catch (err) {
      console.error('share meta error', err);
      next();
    }
  });

  app.use(express.static(clientDist));
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
