import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { deleteObjects } from '../lib/r2';

const router = Router();
const SINGLETON_ID = 'singleton';

const defaults = {
  siteTitle: '',
  taglinePrimary: '',
  taglineSecondary: '',
  commissionsEnabled: true,
  commissionTitle: '',
  commissionBody: [] as string[],
  featuredEnabled: true,
  featuredCount: 6,
  newsletterEnabled: true,
  newsletterTitle: '',
  newsletterTagline: '',
  eventsEnabled: true,
  blogEnabled: false,
  showPrice: true,
  contactEmail: '',
  contactPhone: '',
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
};

router.get('/', async (_req, res) => {
  const [config, socialLinks] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.socialLink.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] }),
  ]);
  res.json({ ...(config ?? { id: SINGLETON_ID, ...defaults }), socialLinks });
});

router.patch('/', requireAdmin, async (req, res) => {
  const {
    siteTitle, taglinePrimary, taglineSecondary, taglineFooter,
    heroImageUrl, heroThumbUrl, heroFullResUrl,
    commissionsEnabled, commissionTitle, commissionBody,
    featuredEnabled, featuredCount,
    newsletterEnabled, newsletterTitle, newsletterTagline,
    eventsEnabled, blogEnabled, showPrice,
    contactEmail, contactPhone, studioLocation, timezone, metaDescription, ogImageUrl,
    contactHeading, contactBody, studioImageUrl, contactImageCaption,
    aboutName, aboutBioSubtitle, aboutBio, aboutStatSubtitle, aboutStatement,
    profileImageUrl, profileThumbUrl, profileFullResUrl,
    aboutStatImage1Url, aboutStatImage2Url,
    aboutShows, aboutAwards, aboutMedia, aboutGalleries, aboutMemberships,
  } = req.body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  // Landing Page
  if (siteTitle !== undefined) data.siteTitle = String(siteTitle);
  if (taglinePrimary !== undefined) data.taglinePrimary = String(taglinePrimary);
  if (taglineSecondary !== undefined) data.taglineSecondary = String(taglineSecondary);
  if (taglineFooter !== undefined) data.taglineFooter = taglineFooter ? String(taglineFooter) : null;

  if (heroImageUrl !== undefined || heroThumbUrl !== undefined || heroFullResUrl !== undefined) {
    const old = await prisma.siteConfig.findUnique({ where: { id: SINGLETON_ID } });
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
  if (showPrice !== undefined) data.showPrice = Boolean(showPrice);

  // Site Info
  if (contactEmail !== undefined) data.contactEmail = contactEmail ? String(contactEmail) : null;
  if (contactPhone !== undefined) data.contactPhone = contactPhone ? String(contactPhone) : null;
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

  const config = await prisma.siteConfig.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...defaults, ...data },
  });
  res.json(config);
});

export default router;
