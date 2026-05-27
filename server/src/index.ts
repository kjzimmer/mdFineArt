import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authRouter from './routes/auth';
import paintingsRouter from './routes/paintings';
import contactRouter from './routes/contact';
import commissionsRouter from './routes/commissions';
import { uploadPainting } from './lib/r2';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB — accommodates large TIFF scans
});

app.get('/api/ping', (_req, res) => res.json({ message: 'pong' }));

app.post('/api/uploads/image', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = await uploadPainting(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json(result);
  } catch (err) {
    console.error('R2 upload failed:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/paintings', paintingsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/commissions', commissionsRouter);

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
