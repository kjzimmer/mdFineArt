import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_EXPIRY = '15m';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const person = await prisma.person.findUnique({
    where: { email: String(email).toLowerCase() },
  });

  if (!person?.isAdmin || !person.passwordHash) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(String(password), person.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const accessToken = jwt.sign(
    { sub: person.id, email: person.email, isAdmin: true },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_EXPIRY }
  );

  const raw = crypto.randomBytes(64).toString('hex');
  const tokenHash = await bcrypt.hash(raw, 10);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);

  await prisma.refreshToken.create({
    data: { personId: person.id, tokenHash, expiresAt },
  });

  res.cookie('refresh_token', raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/api/auth',
  });

  res.json({ success: true, accessToken });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (!raw) {
    return res.status(401).json({ success: false, error: 'No refresh token' });
  }

  const candidates = await prisma.refreshToken.findMany({
    where: { expiresAt: { gt: new Date() }, revokedAt: null },
    include: { person: true },
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const t of candidates) {
    if (await bcrypt.compare(raw, t.tokenHash)) { matched = t; break; }
  }

  if (!matched?.person.isAdmin) {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }

  const accessToken = jwt.sign(
    { sub: matched.person.id, email: matched.person.email, isAdmin: true },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_EXPIRY }
  );

  res.json({ success: true, accessToken });
});

// POST /api/auth/logout
router.post('/logout', requireAdmin, async (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (raw) {
    const tokens = await prisma.refreshToken.findMany({
      where: { revokedAt: null, personId: req.admin!.sub },
    });
    for (const t of tokens) {
      if (await bcrypt.compare(raw, t.tokenHash)) {
        await prisma.refreshToken.update({
          where: { id: t.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

export default router;
