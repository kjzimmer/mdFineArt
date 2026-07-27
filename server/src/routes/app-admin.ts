import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAppAdmin } from '../middleware/auth';
import { upsertPersonByEmail } from '../services/PersonService';
import { provisionPreviewDomain, provisionCustomDomain } from '../services/ProvisioningService';
import { sendWelcomeEmail } from '../services/EmailService';

function galleryBaseUrl(gallery: { customDomain: string | null; previewDomain: string | null }): string | null {
  const domain = gallery.customDomain || gallery.previewDomain;
  return domain ? `https://${domain}` : null;
}

const router = Router();

// All routes require isAppAdmin in the JWT
router.use(requireAppAdmin);

// GET /api/app-admin/galleries — list all galleries with stats
router.get('/galleries', async (_req, res) => {
  const galleries = await prisma.gallery.findMany({
    include: {
      _count: {
        select: { paintings: true, subscribers: true, memberships: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(galleries);
});

// POST /api/app-admin/galleries — provision a new gallery
router.post('/galleries', async (req, res) => {
  const { name, customDomain, ownerEmail, ownerName } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  try {
    const galleryName = String(name).trim();
    const gallery = await prisma.gallery.create({
      data: { slug, name: galleryName, active: true },
    });

    // Gallery.name is the single source of truth — no SiteConfig seeding needed

    let ownerCredentials: { email: string; password: string } | null = null;

    if (ownerEmail) {
      const plainPassword = randomBytes(10).toString('base64url');
      const passwordHash = await bcrypt.hash(plainPassword, 12);
      const person = await upsertPersonByEmail({
        email: String(ownerEmail).toLowerCase().trim(),
        name: ownerName ? String(ownerName).trim() : String(ownerEmail).toLowerCase().trim(),
        passwordHash,
      });
      await prisma.person.update({ where: { id: person.id }, data: { passwordHash } });
      await prisma.galleryMembership.create({
        data: { galleryId: gallery.id, personId: person.id, isAdmin: true },
      });
      ownerCredentials = { email: String(ownerEmail).toLowerCase().trim(), password: plainPassword };
    }

    const provisionErrors: string[] = [];

    try {
      await provisionPreviewDomain(gallery.id, slug);
    } catch (err) {
      provisionErrors.push(err instanceof Error ? err.message : 'Preview provisioning failed');
    }

    if (customDomain && process.env.CF_API_TOKEN) {
      try {
        await provisionCustomDomain(gallery.id, String(customDomain).toLowerCase().trim());
      } catch (err) {
        provisionErrors.push(err instanceof Error ? err.message : 'Custom domain provisioning failed');
      }
    }

    const fresh = await prisma.gallery.findUnique({ where: { id: gallery.id } });

    if (ownerCredentials && fresh) {
      const baseUrl = galleryBaseUrl(fresh);
      if (baseUrl) {
        sendWelcomeEmail({
          to: ownerCredentials.email,
          galleryName: fresh.name,
          galleryUrl: baseUrl,
          adminUrl: `${baseUrl}/admin`,
          password: ownerCredentials.password,
        }).catch((err) => console.error('[welcome-email] failed for', ownerCredentials!.email, err));
      }
    }

    res.status(201).json({ ...fresh, _provisionErrors: provisionErrors, ownerCredentials });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Gallery name or domain already in use' });
    }
    res.status(500).json({ error: 'Failed to create gallery' });
  }
});

// GET /api/app-admin/galleries/:id — gallery detail with members
router.get('/galleries/:id', async (req, res) => {
  const gallery = await prisma.gallery.findUnique({
    where: { id: String(req.params.id) },
    include: {
      memberships: {
        include: { person: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { paintings: true, subscribers: true } },
    },
  });
  if (!gallery) return res.status(404).json({ error: 'Not found' });
  res.json(gallery);
});

// PATCH /api/app-admin/galleries/:id — update name, customDomain, active
router.patch('/galleries/:id', async (req, res) => {
  const { name, customDomain, active } = req.body;
  const galleryId = String(req.params.id);
  try {
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (active !== undefined) data.active = Boolean(active);

    if (customDomain !== undefined) {
      const domain = customDomain ? String(customDomain).toLowerCase().trim() : null;
      if (domain && process.env.CF_API_TOKEN) {
        // provisionCustomDomain updates customDomain, cfZoneId, cfNameservers in DB
        await provisionCustomDomain(galleryId, domain);
      } else {
        data.customDomain = domain;
      }
    }

    // Apply any remaining fields (name, active) if customDomain didn't handle them alone
    if (Object.keys(data).length > 0) {
      await prisma.gallery.update({ where: { id: galleryId }, data });
    }

    const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
    if (!gallery) return res.status(404).json({ error: 'Not found' });
    res.json(gallery);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Domain already in use by another gallery' });
    }
    res.status(500).json({ error: msg || 'Update failed' });
  }
});

// POST /api/app-admin/galleries/:id/provision-preview — provision preview domain for existing gallery
router.post('/galleries/:id/provision-preview', async (req, res) => {
  const galleryId = String(req.params.id);
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return res.status(404).json({ error: 'Not found' });
  if (gallery.previewDomain) {
    return res.json({ previewDomain: gallery.previewDomain, alreadyProvisioned: true });
  }
  try {
    const previewDomain = await provisionPreviewDomain(galleryId, gallery.slug);
    res.json({ previewDomain });
  } catch (err) {
    console.error('[provision-preview] failed for', gallery.slug, err);
    res.status(422).json({ error: err instanceof Error ? err.message : 'Provisioning failed' });
  }
});

// POST /api/app-admin/galleries/:id/provision-custom-domain — (re)provision custom domain
router.post('/galleries/:id/provision-custom-domain', async (req, res) => {
  const galleryId = String(req.params.id);
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return res.status(404).json({ error: 'Not found' });

  const domain = req.body.domain ?? gallery.customDomain;
  if (!domain) return res.status(400).json({ error: 'domain is required' });

  if (!process.env.CF_API_TOKEN) return res.status(500).json({ error: 'CF_API_TOKEN not configured' });

  try {
    const { nameservers, dnsVerified, missingRecords } = await provisionCustomDomain(galleryId, String(domain).toLowerCase().trim());
    const fresh = await prisma.gallery.findUnique({ where: { id: galleryId } });
    res.json({ ...fresh, nameservers, dnsVerified, missingRecords });
  } catch (err) {
    console.error('[provision-custom-domain] failed for', domain, err);
    res.status(422).json({ error: err instanceof Error ? err.message : 'Provisioning failed' });
  }
});

// POST /api/app-admin/galleries/:id/members — add member by email
router.post('/galleries/:id/members', async (req, res) => {
  const galleryId = String(req.params.id);
  const { email, name, isAdmin = false } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

  // Always set a password — generate one if caller didn't supply
  const plainPassword = req.body.password ? String(req.body.password) : randomBytes(10).toString('base64url');
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const person = await upsertPersonByEmail({
    email: String(email).toLowerCase().trim(),
    name: name ? String(name).trim() : String(email).toLowerCase().trim(),
    passwordHash,
  });

  // Ensure password is up to date even if person already existed
  await prisma.person.update({ where: { id: person.id }, data: { passwordHash } });

  const existing = await prisma.galleryMembership.findUnique({
    where: { personId_galleryId: { personId: person.id, galleryId } },
  });
  if (existing) {
    return res.status(409).json({ error: 'Person is already a member of this gallery' });
  }

  const membership = await prisma.galleryMembership.create({
    data: { galleryId, personId: person.id, isAdmin: Boolean(isAdmin) },
    include: { person: { select: { id: true, name: true, email: true } } },
  });

  const baseUrl = galleryBaseUrl(gallery);
  if (baseUrl) {
    sendWelcomeEmail({
      to: person.email,
      galleryName: gallery.name,
      galleryUrl: baseUrl,
      adminUrl: `${baseUrl}/admin`,
      password: plainPassword,
    }).catch((err) => console.error('[welcome-email] failed for', person.email, err));
  }

  // Return generated password once — caller must display/relay it; never stored plain
  res.status(201).json({ ...membership, generatedPassword: plainPassword });
});

// POST /api/app-admin/galleries/:id/members/:personId/set-password
router.post('/galleries/:id/members/:personId/set-password', async (req, res) => {
  const { personId } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password is required' });
  const passwordHash = await bcrypt.hash(String(password), 12);
  await prisma.person.update({ where: { id: String(personId) }, data: { passwordHash } });
  res.json({ success: true });
});

// PATCH /api/app-admin/galleries/:id/members/:personId — toggle isAdmin
router.patch('/galleries/:id/members/:personId', async (req, res) => {
  const galleryId = String(req.params.id);
  const personId = String(req.params.personId);
  const { isAdmin } = req.body;
  try {
    const membership = await prisma.galleryMembership.update({
      where: { personId_galleryId: { personId, galleryId } },
      data: { isAdmin: Boolean(isAdmin) },
      include: { person: { select: { id: true, name: true, email: true } } },
    });
    res.json(membership);
  } catch {
    res.status(404).json({ error: 'Membership not found' });
  }
});

// DELETE /api/app-admin/galleries/:id/members/:personId — remove member
router.delete('/galleries/:id/members/:personId', async (req, res) => {
  const galleryId = String(req.params.id);
  const personId = String(req.params.personId);
  try {
    await prisma.galleryMembership.delete({
      where: { personId_galleryId: { personId, galleryId } },
    });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Membership not found' });
  }
});

export default router;
