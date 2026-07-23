/**
 * One-time backfill: creates Melody's Gallery record and stamps all existing
 * rows with her galleryId. Safe to re-run — checks before inserting.
 *
 * Run with:  npx tsx prisma/seed-melody.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create (or find) Melody's gallery
  let gallery = await prisma.gallery.findUnique({ where: { slug: 'melody' } });
  if (!gallery) {
    gallery = await prisma.gallery.create({
      data: {
        slug: 'melody',
        name: 'Melody DeBenedictis Fine Art',
        customDomain: 'melodydebenedictis.com',
        active: true,
      },
    });
    console.log('Created gallery:', gallery.id);
  } else {
    console.log('Gallery already exists:', gallery.id);
  }

  const galleryId = gallery.id;

  // 2. Create GalleryMembership for every existing admin Person
  const admins = await prisma.person.findMany({ where: { isAdmin: true } });
  for (const admin of admins) {
    const existing = await prisma.galleryMembership.findUnique({
      where: { personId_galleryId: { personId: admin.id, galleryId } },
    });
    if (!existing) {
      await prisma.galleryMembership.create({
        data: { personId: admin.id, galleryId, isAdmin: true },
      });
      console.log('Created membership for:', admin.email);
    } else {
      console.log('Membership already exists for:', admin.email);
    }
  }

  // 3. Backfill all scoped tables
  const tables: Array<{ label: string; update: () => Promise<{ count: number }> }> = [
    { label: 'Painting',             update: () => prisma.painting.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'PrintProduct',         update: () => prisma.printProduct.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'Spotlight',            update: () => prisma.spotlight.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'Order',                update: () => prisma.order.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'ContactMessage',       update: () => prisma.contactMessage.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'CommissionRequest',    update: () => prisma.commissionRequest.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'NewsletterSubscriber', update: () => prisma.newsletterSubscriber.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'SocialLink',           update: () => prisma.socialLink.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'SlideshowSlide',       update: () => prisma.slideshowSlide.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
    { label: 'DailyAnalytics',       update: () => prisma.dailyAnalytics.updateMany({ where: { galleryId: null }, data: { galleryId } }) },
  ];

  for (const t of tables) {
    const result = await t.update();
    console.log(`Backfilled ${t.label}: ${result.count} rows`);
  }

  // SiteConfig has a singleton row — update by its fixed id
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });
  if (config && !config.galleryId) {
    await prisma.siteConfig.update({ where: { id: 'singleton' }, data: { galleryId } });
    console.log('Backfilled SiteConfig');
  } else {
    console.log('SiteConfig already has galleryId or does not exist');
  }

  console.log('\nBackfill complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
