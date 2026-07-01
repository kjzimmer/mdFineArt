import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import authRouter from './routes/auth';
import paintingsRouter from './routes/paintings';
import contactRouter from './routes/contact';
import commissionsRouter from './routes/commissions';
import uploadsRouter from './routes/uploads';
import newsletterRouter from './routes/newsletter';
import peopleRouter from './routes/people';
import ordersRouter from './routes/orders';
import analyticsRouter from './routes/analytics';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    // Same-origin requests (production) have no Origin header
    if (!origin || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/ping', (_req, res) => res.json({ message: 'pong' }));

app.use('/api/auth', authRouter);
app.use('/api/paintings', paintingsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/people', peopleRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);

// Serve built frontend in production
// __dirname is server/dist/ — go up two levels to reach project root
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
