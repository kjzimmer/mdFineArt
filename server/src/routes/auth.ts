import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { loginLimit } from '../middleware/rateLimit';
import { sendPasswordResetEmail } from '../services/EmailService';

const router = Router();

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_EXPIRY = '15m';

// POST /api/auth/login
router.post('/login', loginLimit, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const person = await prisma.person.findUnique({
    where: { email: String(email).toLowerCase() },
    include: {
      memberships: { where: { galleryId: req.gallery!.id } },
    },
  });

  if (!person || !person.passwordHash) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(String(password), person.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const membership = person.memberships[0];
  if (!person.isAppAdmin && !membership) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const isAdmin = person.isAppAdmin || (membership?.isAdmin ?? false);

  const accessToken = jwt.sign(
    { sub: person.id, email: person.email, isAdmin, isAppAdmin: person.isAppAdmin, galleryId: req.gallery!.id },
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

  if (!matched) {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }

  const person = matched.person;

  // Re-resolve membership for this gallery
  const membership = await prisma.galleryMembership.findUnique({
    where: { personId_galleryId: { personId: person.id, galleryId: req.gallery!.id } },
  });

  if (!person.isAppAdmin && !membership) {
    return res.status(401).json({ success: false, error: 'Not authorized for this gallery' });
  }

  const isAdmin = person.isAppAdmin || (membership?.isAdmin ?? false);

  const accessToken = jwt.sign(
    { sub: person.id, email: person.email, isAdmin, isAppAdmin: person.isAppAdmin, galleryId: req.gallery!.id },
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

// POST /api/auth/forgot-password
router.post('/forgot-password', loginLimit, async (req, res) => {
  // Always respond 200 — never reveal whether an email exists
  const { email } = req.body;
  if (!email) return res.json({ success: true });

  const person = await prisma.person.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!person?.passwordHash) return res.json({ success: true });

  // Invalidate any outstanding tokens for this person
  await prisma.passwordResetToken.updateMany({
    where: { personId: person.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  await prisma.passwordResetToken.create({
    data: { personId: person.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  // Use the actual request host so the link goes back to where the user is
  const requestHost = req.get('host');
  if (requestHost) {
    sendPasswordResetEmail({
      to: person.email,
      galleryName: req.gallery!.name,
      resetUrl: `https://${requestHost}/reset-password?token=${raw}`,
    }).catch((err) => console.error('[reset-email] failed for', person.email, err));
  }

  res.json({ success: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, personId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 12);

  await prisma.$transaction([
    prisma.person.update({ where: { id: record.personId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { personId: record.personId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

export default router;
