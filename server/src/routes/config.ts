import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { deleteObjects } from '../lib/r2';
import { ENFORCED_FEATURES, getEffectiveSiteConfig, getOrderedTierChain, isFeatureAvailable } from '../lib/featureGating';

const router = Router();

const defaults = {
  taglinePrimary: '',
  taglineSecondary: '',
  commissionsEnabled: false,
  commissionTitle: '',
  commissionBody: [] as string[],
  featuredEnabled: false,
  featuredCount: 6,
  newsletterEnabled: false,
  newsletterTitle: '',
  newsletterTagline: '',
  eventsEnabled: false,
  blogEnabled: false,
  worksInProgressEnabled: false,
  referenceLibraryEnabled: false,
  showPrice: false,
  contactEmail: '',
  contactPhone: '',
  businessAddress: '',
  studioLocation: '',
  timezone: '',
  metaDescription: '',
  ogImageUrl: '',
  studioImageUrl: '',
  aboutName: '',
  aboutBio: [] as string[],
  aboutStatement: [] as string[],
  profileImageUrl: '',
  profileThumbUrl: '',
  profileFullResUrl: '',
  aboutStatImage1Url: '',
  aboutStatImage2Url: '',
  aboutShows: [],
  aboutAwards: [],
  aboutMedia: [],
  aboutGalleries: [],
  aboutMemberships: [],
  classesBody: [] as string[],
};

router.get('/', async (req, res) => {
  const gallery = req.gallery!;
  const [config, socialLinks] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { galleryId: gallery.id } }),
    prisma.socialLink.findMany({
      where: { galleryId: gallery.id },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);
  const base = config ?? { id: gallery.id, galleryId: gallery.id, ...defaults };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effective = await getEffectiveSiteConfig(base as any, gallery.id);
  // name comes from Gallery.name — single source of truth
  res.json({ ...effective, name: gallery.name, socialLinks });
});

router.patch('/', requireAdmin, async (req, res) => {
  const galleryId = req.gallery!.id;
  const {
    name, taglinePrimary, taglineSecondary, taglineFooter,
    heroImageUrl, heroThumbUrl, heroFullResUrl,
    commissionsEnabled, commissionTitle, commissionBody,
    featuredEnabled, featuredCount,
    newsletterEnabled, newsletterTitle, newsletterTagline,
    eventsEnabled, blogEnabled, musicEnabled, classesEnabled, showPrice, mediaTypes, worksLabel, theme,
    worksInProgressEnabled, referenceLibraryEnabled,
    contactEmail, contactPhone, businessAddress, studioLocation, timezone, metaDescription, ogImageUrl,
    contactHeading, contactBody, studioImageUrl, contactImageCaption,
    aboutName, aboutBioSubtitle, aboutBio, aboutStatSubtitle, aboutStatement,
    profileImageUrl, profileThumbUrl, profileFullResUrl,
    aboutStatImage1Url, aboutStatImage2Url,
    aboutShows, aboutAwards, aboutMedia, aboutGalleries, aboutMemberships,
    classesLabel, classesHeading, classesBody,
    logoUrl,
  } = req.body;

  // name lives on Gallery, not SiteConfig — update it separately
  if (name !== undefined) {
    await prisma.gallery.update({ where: { id: galleryId }, data: { name: String(name).trim() } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  // Landing Page
  if (taglinePrimary !== undefined) data.taglinePrimary = String(taglinePrimary);
  if (taglineSecondary !== undefined) data.taglineSecondary = String(taglineSecondary);
  if (taglineFooter !== undefined) data.taglineFooter = taglineFooter ? String(taglineFooter) : null;

  if (heroImageUrl !== undefined || heroThumbUrl !== undefined || heroFullResUrl !== undefined) {
    const old = await prisma.siteConfig.findUnique({ where: { galleryId } });
    if (old?.heroImageUrl && heroImageUrl !== old.heroImageUrl) {
      await deleteObjects([old.heroImageUrl, old.heroThumbUrl, old.heroFullResUrl]);
    }
    data.heroImageUrl = heroImageUrl ? String(heroImageUrl) : null;
    data.heroThumbUrl = heroThumbUrl ? String(heroThumbUrl) : null;
    data.heroFullResUrl = heroFullResUrl ? String(heroFullResUrl) : null;
  }

  // Site Features
  if (commissionsEnabled !== undefined) data.commissionsEnabled = Boolean(commissionsEnabled);
  if (commissionTitle !== undefined) data.commissionTitle = String(commissionTitle);
  if (commissionBody !== undefined) data.commissionBody = Array.isArray(commissionBody) ? commissionBody.map(String) : [];
  if (featuredEnabled !== undefined) data.featuredEnabled = Boolean(featuredEnabled);
  if (featuredCount !== undefined) data.featuredCount = Number(featuredCount);
  if (newsletterEnabled !== undefined) data.newsletterEnabled = Boolean(newsletterEnabled);
  if (newsletterTitle !== undefined) data.newsletterTitle = newsletterTitle ? String(newsletterTitle) : null;
  if (newsletterTagline !== undefined) data.newsletterTagline = newsletterTagline ? String(newsletterTagline) : null;
  if (eventsEnabled !== undefined) data.eventsEnabled = Boolean(eventsEnabled);
  if (blogEnabled !== undefined) data.blogEnabled = Boolean(blogEnabled);
  if (musicEnabled !== undefined) data.musicEnabled = Boolean(musicEnabled);
  if (classesEnabled !== undefined) data.classesEnabled = Boolean(classesEnabled);
  if (worksInProgressEnabled !== undefined) data.worksInProgressEnabled = Boolean(worksInProgressEnabled);
  if (referenceLibraryEnabled !== undefined) data.referenceLibraryEnabled = Boolean(referenceLibraryEnabled);
  if (showPrice !== undefined) data.showPrice = Boolean(showPrice);
  if (mediaTypes !== undefined) data.mediaTypes = Array.isArray(mediaTypes) ? mediaTypes.map(String) : [];
  if (worksLabel !== undefined) data.worksLabel = worksLabel ? String(worksLabel) : null;
  if (theme !== undefined) data.theme = theme ? String(theme) : null;

  // Site Info
  if (contactEmail !== undefined) data.contactEmail = contactEmail ? String(contactEmail) : null;
  if (contactPhone !== undefined) data.contactPhone = contactPhone ? String(contactPhone) : null;
  if (businessAddress !== undefined) data.businessAddress = businessAddress ? String(businessAddress) : null;
  if (studioLocation !== undefined) data.studioLocation = studioLocation ? String(studioLocation) : null;
  if (timezone !== undefined) data.timezone = timezone ? String(timezone) : null;
  if (metaDescription !== undefined) data.metaDescription = metaDescription ? String(metaDescription) : null;
  if (ogImageUrl !== undefined) data.ogImageUrl = ogImageUrl ? String(ogImageUrl) : null;
  // Contact
  if (contactHeading !== undefined) data.contactHeading = contactHeading ? String(contactHeading) : null;
  if (contactBody !== undefined) data.contactBody = Array.isArray(contactBody) ? contactBody.map(String) : [];
  if (studioImageUrl !== undefined) data.studioImageUrl = studioImageUrl ? String(studioImageUrl) : null;
  if (contactImageCaption !== undefined) data.contactImageCaption = contactImageCaption ? String(contactImageCaption) : null;

  // About Page
  if (aboutName !== undefined) data.aboutName = aboutName ? String(aboutName) : null;
  if (aboutBioSubtitle !== undefined) data.aboutBioSubtitle = aboutBioSubtitle ? String(aboutBioSubtitle) : null;
  if (aboutBio !== undefined) data.aboutBio = Array.isArray(aboutBio) ? aboutBio.map(String) : [];
  if (aboutStatSubtitle !== undefined) data.aboutStatSubtitle = aboutStatSubtitle ? String(aboutStatSubtitle) : null;
  if (aboutStatement !== undefined) data.aboutStatement = Array.isArray(aboutStatement) ? aboutStatement.map(String) : [];
  if (profileImageUrl !== undefined) data.profileImageUrl = profileImageUrl ? String(profileImageUrl) : null;
  if (profileThumbUrl !== undefined) data.profileThumbUrl = profileThumbUrl ? String(profileThumbUrl) : null;
  if (profileFullResUrl !== undefined) data.profileFullResUrl = profileFullResUrl ? String(profileFullResUrl) : null;
  if (aboutStatImage1Url !== undefined) data.aboutStatImage1Url = aboutStatImage1Url ? String(aboutStatImage1Url) : null;
  if (aboutStatImage2Url !== undefined) data.aboutStatImage2Url = aboutStatImage2Url ? String(aboutStatImage2Url) : null;
  if (aboutShows !== undefined) data.aboutShows = Array.isArray(aboutShows) ? aboutShows : [];
  if (aboutAwards !== undefined) data.aboutAwards = Array.isArray(aboutAwards) ? aboutAwards : [];
  if (aboutMedia !== undefined) data.aboutMedia = Array.isArray(aboutMedia) ? aboutMedia : [];
  if (aboutGalleries !== undefined) data.aboutGalleries = Array.isArray(aboutGalleries) ? aboutGalleries : [];
  if (aboutMemberships !== undefined) data.aboutMemberships = Array.isArray(aboutMemberships) ? aboutMemberships : [];

  // Classes page
  if (classesLabel !== undefined) data.classesLabel = classesLabel ? String(classesLabel) : null;
  if (classesHeading !== undefined) data.classesHeading = classesHeading ? String(classesHeading) : null;
  if (classesBody !== undefined) data.classesBody = Array.isArray(classesBody) ? classesBody.map(String) : [];

  // Branding
  if (logoUrl !== undefined) data.logoUrl = logoUrl ? String(logoUrl) : null;

  // Reject (don't silently drop) an attempt to turn on a feature the gallery's subscription
  // tier doesn't include — the client needs to see this failed, not have it quietly no-op.
  const enforcedEntries = Object.entries(ENFORCED_FEATURES).filter(
    ([, configField]) => data[configField] === true,
  );
  if (enforcedEntries.length > 0) {
    const [features, chain] = await Promise.all([
      prisma.feature.findMany({
        where: { key: { in: enforcedEntries.map(([key]) => key) } },
        select: { key: true, minimumTierId: true },
      }),
      getOrderedTierChain(),
    ]);
    const minTierByKey = new Map(features.map((f) => [f.key, f.minimumTierId]));
    for (const [featureKey] of enforcedEntries) {
      const minimumTierId = minTierByKey.get(featureKey) ?? null;
      if (!isFeatureAvailable(req.gallery!.subscriptionTierId, minimumTierId, chain)) {
        return res.status(403).json({ error: 'This feature requires a higher subscription tier.' });
      }
    }
  }

  const config = await prisma.siteConfig.upsert({
    where: { galleryId },
    update: data,
    create: { id: galleryId, galleryId, ...defaults, ...data },
  });

  // Return name from Gallery (may have just been updated above)
  const updatedGallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  res.json({ ...config, name: updatedGallery?.name ?? '' });
});

export default router;
