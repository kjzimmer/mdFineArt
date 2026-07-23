import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { resolveGallery } from './middleware/gallery';
import authRouter from './routes/auth';
import paintingsRouter from './routes/paintings';
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

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: true,  // reflect request origin — required for credentials + ES module asset loading
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/ping', (_req, res) => res.json({ message: 'pong' }));

// Resolve gallery from Host header before all API routes.
// Local dev: set GALLERY_SLUG=melody in .env to bypass domain lookup.
app.use('/api', resolveGallery);

app.use('/api/auth', authRouter);
app.use('/api/paintings', paintingsRouter);
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

// Serve built frontend in production
// __dirname is server/dist/ — go up two levels to reach project root
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
