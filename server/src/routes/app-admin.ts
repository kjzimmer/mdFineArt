import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAppAdmin } from '../middleware/auth';
import { upsertPersonByEmail } from '../services/PersonService';
import { provisionPreviewDomain, provisionCustomDomain } from '../services/ProvisioningService';
import { sendWelcomeEmail } from '../services/EmailService';
import { ENFORCED_FEATURES, getOrderedTierChain } from '../lib/featureGating';

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
        select: { works: true, subscribers: true, memberships: true },
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
      const emailNorm = String(ownerEmail).toLowerCase().trim();
      const existing = await prisma.person.findUnique({ where: { email: emailNorm }, select: { id: true, passwordHash: true } });

      let personId: string;
      if (existing?.passwordHash) {
        // Existing user with credentials — add to gallery only, never overwrite their password
        personId = existing.id;
      } else {
        // New person or no password yet — generate one
        const plainPassword = randomBytes(10).toString('base64url');
        const passwordHash = await bcrypt.hash(plainPassword, 12);
        const person = await upsertPersonByEmail({
          email: emailNorm,
          name: ownerName ? String(ownerName).trim() : emailNorm,
          passwordHash,
        });
        await prisma.person.update({ where: { id: person.id }, data: { passwordHash } });
        personId = person.id;
        ownerCredentials = { email: emailNorm, password: plainPassword };
      }

      await prisma.galleryMembership.create({
        data: { galleryId: gallery.id, personId, isAdmin: true },
      });
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

    if (ownerEmail && fresh?.previewDomain) {
      const previewUrl = `https://${fresh.previewDomain}`;
      const customDomainUrl = fresh.customDomain ? `https://${fresh.customDomain}` : undefined;
      sendWelcomeEmail({
        to: String(ownerEmail).toLowerCase().trim(),
        galleryName: fresh.name,
        previewUrl,
        customDomainUrl,
        adminUrl: `${previewUrl}/admin`,
        password: ownerCredentials?.password,
        nameservers: (fresh.cfNameservers?.length ?? 0) > 0 ? fresh.cfNameservers : undefined,
      }).catch((err) => console.error('[welcome-email] failed for', ownerEmail, err));
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
      _count: { select: { works: true, subscribers: true } },
    },
  });
  if (!gallery) return res.status(404).json({ error: 'Not found' });
  res.json(gallery);
});

// PATCH /api/app-admin/galleries/:id — update name, customDomain, active
router.patch('/galleries/:id', async (req, res) => {
  const { name, customDomain, active, subscriptionTierId } = req.body;
  const galleryId = String(req.params.id);
  try {
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (active !== undefined) data.active = Boolean(active);
    if (subscriptionTierId !== undefined) data.subscriptionTierId = subscriptionTierId || null;

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

  const emailNorm = String(email).toLowerCase().trim();
  const existing = await prisma.person.findUnique({ where: { email: emailNorm }, select: { id: true, passwordHash: true } });

  let plainPassword: string | null = null;
  let person;

  if (existing?.passwordHash) {
    // Existing user — add to gallery without touching their password
    person = existing;
  } else {
    plainPassword = req.body.password ? String(req.body.password) : randomBytes(10).toString('base64url');
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    person = await upsertPersonByEmail({
      email: emailNorm,
      name: name ? String(name).trim() : emailNorm,
      passwordHash,
    });
    await prisma.person.update({ where: { id: person.id }, data: { passwordHash } });
  }

  const existingMembership = await prisma.galleryMembership.findUnique({
    where: { personId_galleryId: { personId: person.id, galleryId } },
  });
  if (existingMembership) {
    return res.status(409).json({ error: 'Person is already a member of this gallery' });
  }

  const membership = await prisma.galleryMembership.create({
    data: { galleryId, personId: person.id, isAdmin: Boolean(isAdmin) },
    include: { person: { select: { id: true, name: true, email: true } } },
  });

  if (gallery.previewDomain) {
    const previewUrl = `https://${gallery.previewDomain}`;
    const customDomainUrl = gallery.customDomain ? `https://${gallery.customDomain}` : undefined;
    sendWelcomeEmail({
      to: membership.person.email,
      galleryName: gallery.name,
      previewUrl,
      customDomainUrl,
      adminUrl: `${previewUrl}/admin`,
      password: plainPassword ?? undefined,
      nameservers: (gallery.cfNameservers?.length ?? 0) > 0 ? gallery.cfNameservers : undefined,
    }).catch((err) => console.error('[welcome-email] failed for', membership.person.email, err));
  }

  // Return generated password once — null if person already had credentials
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

// DELETE /api/app-admin/galleries/:id — permanently delete gallery and all its data
router.delete('/galleries/:id', async (req, res) => {
  const galleryId = String(req.params.id);
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (!gallery) return res.status(404).json({ error: 'Not found' });

  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({ where: { galleryId }, select: { id: true } });
    if (orders.length > 0) {
      await tx.orderItem.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } });
    }
    await tx.order.deleteMany({ where: { galleryId } });
    await tx.spotlight.deleteMany({ where: { galleryId } });
    await tx.printProduct.deleteMany({ where: { galleryId } });
    // AssetLinkage.workId has no DB cascade — must clear before work.deleteMany below.
    await tx.assetLinkage.deleteMany({ where: { galleryId } });
    await tx.digitalAsset.deleteMany({ where: { galleryId } });
    await tx.work.deleteMany({ where: { galleryId } });
    await tx.contactMessage.deleteMany({ where: { galleryId } });
    await tx.commissionRequest.deleteMany({ where: { galleryId } });
    await tx.newsletterSubscriber.deleteMany({ where: { galleryId } });
    await tx.socialLink.deleteMany({ where: { galleryId } });
    await tx.slideshowSlide.deleteMany({ where: { galleryId } });
    await tx.testimonial.deleteMany({ where: { galleryId } });
    await tx.dailyAnalytics.deleteMany({ where: { galleryId } });
    await tx.event.deleteMany({ where: { galleryId } });
    await tx.classOffering.deleteMany({ where: { galleryId } });
    await tx.supportMessage.deleteMany({ where: { galleryId } });
    await tx.supportLog.deleteMany({ where: { galleryId } });
    await tx.personGalleryLink.deleteMany({ where: { galleryId } });
    await tx.siteConfig.deleteMany({ where: { galleryId } });
    await tx.galleryMembership.deleteMany({ where: { galleryId } });
    await tx.gallery.delete({ where: { id: galleryId } });
  });

  res.json({ success: true });
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

// GET /api/app-admin/features — feature catalog, editable descriptions only (create/delete is
// design-time/code-time, not an admin-panel operation)
router.get('/features', async (_req, res) => {
  const features = await prisma.feature.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(features.map((f) => ({ ...f, enforced: f.key in ENFORCED_FEATURES })));
});

// PATCH /api/app-admin/features/:id — edit description/category/status/sortOrder/minimumTierId
router.patch('/features/:id', async (req, res) => {
  const { name, customerDescription, internalNote, category, status, sortOrder, minimumTierId } = req.body;
  const featureId = String(req.params.id);

  const existing = await prisma.feature.findUnique({ where: { id: featureId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = String(name).trim();
  if (customerDescription !== undefined) data.customerDescription = customerDescription ? String(customerDescription) : null;
  if (internalNote !== undefined) data.internalNote = internalNote ? String(internalNote) : null;
  if (category !== undefined) data.category = category ? String(category) : null;
  if (status !== undefined) data.status = String(status);
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
  if (minimumTierId !== undefined) data.minimumTierId = minimumTierId || null;

  const feature = await prisma.feature.update({ where: { id: featureId }, data });
  res.json({ ...feature, enforced: feature.key in ENFORCED_FEATURES });
});

// GET /api/app-admin/subscription-tiers — ordered lowest to highest
router.get('/subscription-tiers', async (_req, res) => {
  const [tiers, chain] = await Promise.all([
    prisma.subscriptionTier.findMany(),
    getOrderedTierChain(),
  ]);
  const byId = new Map(tiers.map((t) => [t.id, t]));
  res.json(chain.map((id) => byId.get(id)).filter(Boolean));
});

// POST /api/app-admin/subscription-tiers — always appends at the current top of the chain
router.post('/subscription-tiers', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const chain = await getOrderedTierChain();
  const topId = chain.length > 0 ? chain[chain.length - 1] : null;

  const tier = await prisma.subscriptionTier.create({
    data: { name: String(name).trim(), description: description ? String(description) : null, previousTierId: topId },
  });
  res.status(201).json(tier);
});

// PATCH /api/app-admin/subscription-tiers/:id — name/description only, never chain position
router.patch('/subscription-tiers/:id', async (req, res) => {
  const { name, description } = req.body;
  const tierId = String(req.params.id);

  const existing = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = String(name).trim();
  if (description !== undefined) data.description = description ? String(description) : null;

  const tier = await prisma.subscriptionTier.update({ where: { id: tierId }, data });
  res.json(tier);
});

// DELETE /api/app-admin/subscription-tiers/:id — blocked if referenced; re-links the chain
router.delete('/subscription-tiers/:id', async (req, res) => {
  const tierId = String(req.params.id);
  try {
    await prisma.$transaction(async (tx) => {
      const tier = await tx.subscriptionTier.findUnique({ where: { id: tierId } });
      if (!tier) throw new Error('NOT_FOUND');

      const [featureCount, galleryCount] = await Promise.all([
        tx.feature.count({ where: { minimumTierId: tierId } }),
        tx.gallery.count({ where: { subscriptionTierId: tierId } }),
      ]);
      if (featureCount > 0 || galleryCount > 0) {
        throw new Error(`IN_USE: referenced by ${featureCount} feature(s) and ${galleryCount} galler${galleryCount === 1 ? 'y' : 'ies'}`);
      }

      // The tier (if any) that points at this one as its previousTierId — i.e. the tier
      // immediately above it in the chain.
      const nextTier = await tx.subscriptionTier.findUnique({ where: { previousTierId: tierId } });

      await tx.subscriptionTier.delete({ where: { id: tierId } });
      if (nextTier) {
        await tx.subscriptionTier.update({ where: { id: nextTier.id }, data: { previousTierId: tier.previousTierId } });
      }
    });
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    if (msg.startsWith('IN_USE')) return res.status(409).json({ error: `Tier is still in use — ${msg.slice(7)}` });
    res.status(500).json({ error: 'Delete failed' });
  }
});

// GET /api/app-admin/support-logs — all logged items across all galleries
router.get('/support-logs', async (_req, res) => {
  const logs = await prisma.supportLog.findMany({
    include: { gallery: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(logs);
});

// DELETE /api/app-admin/support-logs/:id — dismiss a log entry
router.delete('/support-logs/:id', async (req, res) => {
  try {
    await prisma.supportLog.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Log entry not found' });
  }
});

export default router;
