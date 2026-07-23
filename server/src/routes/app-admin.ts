import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAppAdmin } from '../middleware/auth';
import { upsertPersonByEmail } from '../services/PersonService';
import { provisionPreviewDomain, lookupCfZoneId } from '../services/ProvisioningService';

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

  // Auto-generate slug from name
  const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  try {
    const gallery = await prisma.gallery.create({
      data: {
        slug,
        name: String(name).trim(),
        customDomain: customDomain ? String(customDomain).toLowerCase().trim() : null,
        active: true,
      },
    });

    // Add initial admin member if email provided
    if (ownerEmail) {
      const person = await upsertPersonByEmail({
        email: String(ownerEmail).toLowerCase().trim(),
        name: ownerName ? String(ownerName).trim() : String(ownerEmail).toLowerCase().trim(),
      });
      await prisma.galleryMembership.create({
        data: { galleryId: gallery.id, personId: person.id, isAdmin: true },
      });
    }

    // Provision preview domain (non-blocking — errors reported but don't fail creation)
    const provisionErrors: string[] = [];
    try {
      await provisionPreviewDomain(gallery.id, slug);
    } catch (err) {
      provisionErrors.push(err instanceof Error ? err.message : 'Preview provisioning failed');
    }

    // Auto-lookup cfZoneId if customDomain provided
    if (customDomain && process.env.CF_API_TOKEN) {
      const cfZoneId = await lookupCfZoneId(String(customDomain).toLowerCase().trim()).catch(() => null);
      if (cfZoneId) {
        await prisma.gallery.update({ where: { id: gallery.id }, data: { cfZoneId } });
      }
    }

    const fresh = await prisma.gallery.findUnique({ where: { id: gallery.id } });
    res.status(201).json({ ...fresh, _provisionErrors: provisionErrors });
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
  try {
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (active !== undefined) data.active = Boolean(active);
    if (customDomain !== undefined) {
      const domain = customDomain ? String(customDomain).toLowerCase().trim() : null;
      data.customDomain = domain;
      // Auto-lookup cfZoneId when domain is set
      if (domain && process.env.CF_API_TOKEN) {
        const cfZoneId = await lookupCfZoneId(domain).catch(() => null);
        if (cfZoneId) data.cfZoneId = cfZoneId;
      }
    }
    const gallery = await prisma.gallery.update({ where: { id: String(req.params.id) }, data });
    res.json(gallery);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Domain already in use by another gallery' });
    }
    res.status(404).json({ error: 'Not found' });
  }
});

// POST /api/app-admin/galleries/:id/provision-preview — create preview domain for existing gallery
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
    res.status(502).json({ error: err instanceof Error ? err.message : 'Provisioning failed' });
  }
});

// POST /api/app-admin/galleries/:id/members — add member by email
router.post('/galleries/:id/members', async (req, res) => {
  const galleryId = String(req.params.id);
  const { email, name, isAdmin = false } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return res.status(404).json({ error: 'Gallery not found' });

  const person = await upsertPersonByEmail({
    email: String(email).toLowerCase().trim(),
    name: name ? String(name).trim() : String(email).toLowerCase().trim(),
  });

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
  res.status(201).json(membership);
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
