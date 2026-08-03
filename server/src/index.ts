import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { resolveGallery, resolveGalleryFromRequest } from './middleware/gallery';
import { prisma } from './prisma';
import {
  renderHome, renderGalleryIndex, renderWorkDetail, renderAbout, renderCommission,
  renderEvents, renderClasses, gallerySchema, workSchema, personSchema,
  renderSitemap, renderRobots, sendSsrPage,
} from './services/storyContent';
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
  // Server-rendered story content for public routes, so AI/search crawlers (which don't
  // execute JS) see the gallery's actual story — bio, work descriptions, commission pitch,
  // event/class listings — instead of the empty SPA shell. Same content sent to every
  // visitor, not just detected bots (no cloaking risk, no headless browser); React mounts
  // and fully replaces #root immediately for real users. Falls through to the generic SPA
  // shell below whenever the gallery/route data can't be resolved.
  // See docs/wip/gallery-discoverability.md and server/src/services/storyContent.ts.
  const ssrContext = async (req: express.Request) => {
    const gallery = await resolveGalleryFromRequest(req);
    if (!gallery || !gallery.active) return null;
    const config = await prisma.siteConfig.findUnique({ where: { galleryId: gallery.id } });
    if (!config) return null;
    return { gallery, config };
  };

  app.get('/', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery, config } = ctx;
      const featured = config.featuredEnabled
        ? await prisma.work.findMany({
            where: { galleryId: gallery.id, featured: true },
            orderBy: { createdAt: 'desc' },
            take: config.featuredCount,
          })
        : [];
      sendSsrPage(res, req, clientDist, renderHome(gallery, config, featured), gallery.name, gallerySchema(gallery, config));
    } catch (err) {
      console.error('ssr home error', err);
      next();
    }
  });

  app.get('/gallery', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery, config } = ctx;
      const works = await prisma.work.findMany({
        where: { galleryId: gallery.id },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      });
      sendSsrPage(res, req, clientDist, renderGalleryIndex(gallery, config, works), gallery.name);
    } catch (err) {
      console.error('ssr gallery index error', err);
      next();
    }
  });

  app.get('/gallery/:slug', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery, config } = ctx;
      const work = await prisma.work.findFirst({ where: { galleryId: gallery.id, slug: req.params.slug } });
      if (!work) return next();
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      sendSsrPage(res, req, clientDist, renderWorkDetail(gallery, config, work), gallery.name, workSchema(gallery, config, work, url));
    } catch (err) {
      console.error('ssr work detail error', err);
      next();
    }
  });

  app.get('/about', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery, config } = ctx;
      sendSsrPage(res, req, clientDist, renderAbout(gallery, config), gallery.name, personSchema(config) ?? undefined);
    } catch (err) {
      console.error('ssr about error', err);
      next();
    }
  });

  app.get('/commission', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery, config } = ctx;
      sendSsrPage(res, req, clientDist, renderCommission(gallery, config), gallery.name);
    } catch (err) {
      console.error('ssr commission error', err);
      next();
    }
  });

  app.get('/events', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery } = ctx;
      const events = await prisma.event.findMany({
        where: { galleryId: gallery.id, published: true },
        orderBy: { date: 'asc' },
      });
      sendSsrPage(res, req, clientDist, renderEvents(gallery, events), gallery.name);
    } catch (err) {
      console.error('ssr events error', err);
      next();
    }
  });

  app.get('/classes', async (req, res, next) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return next();
      const { gallery, config } = ctx;
      const offerings = await prisma.classOffering.findMany({
        where: { galleryId: gallery.id, published: true },
        orderBy: { sortOrder: 'asc' },
      });
      sendSsrPage(res, req, clientDist, renderClasses(gallery, config, offerings), gallery.name);
    } catch (err) {
      console.error('ssr classes error', err);
      next();
    }
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(renderRobots(baseUrl));
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const ctx = await ssrContext(req);
      if (!ctx) return res.status(404).type('text/plain').send('Not found');
      const { gallery, config } = ctx;
      const works = await prisma.work.findMany({ where: { galleryId: gallery.id }, select: { slug: true } });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      res.type('application/xml').send(renderSitemap(baseUrl, config, works.map((w) => w.slug)));
    } catch (err) {
      console.error('sitemap error', err);
      res.status(500).type('text/plain').send('');
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
