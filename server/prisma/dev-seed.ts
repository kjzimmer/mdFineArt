/**
 * Dev seed — sets up a complete local environment from a clean DB.
 *
 * Usage:
 *   npx tsx prisma/dev-seed.ts <admin-email> <admin-password>
 *
 * Creates:
 *   - Gallery (slug: melody)
 *   - SiteConfig for that gallery
 *   - App admin Person with the supplied credentials
 *   - GalleryMembership linking them
 *   - 5 sample works with Unsplash placeholder images
 *
 * Safe to re-run — uses upsert throughout.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx prisma/dev-seed.ts <admin-email> <admin-password>');
    process.exit(1);
  }

  // 1. Gallery
  const gallery = await prisma.gallery.upsert({
    where: { slug: 'melody' },
    update: {},
    create: {
      slug: 'melody',
      name: 'Melody DeBenedictis Fine Art',
      customDomain: 'melodydebenedictis.com',
      active: true,
    },
  });
  console.log(`Gallery: ${gallery.slug} (${gallery.id})`);

  // 2. SiteConfig
  await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    update: { galleryId: gallery.id },
    create: {
      id: 'singleton',
      galleryId: gallery.id,
      taglinePrimary: 'Western Oil Paintings',
      taglineSecondary: 'Original works and fine art prints',
      taglineFooter: 'Original Western Oil Paintings',
      worksLabel: 'Works',
    },
  });
  console.log('SiteConfig: ready');

  // 3. App admin Person
  const passwordHash = await bcrypt.hash(password, 12);
  const person = await prisma.person.upsert({
    where: { email: email.toLowerCase() },
    update: { isAppAdmin: true, passwordHash },
    create: {
      email: email.toLowerCase(),
      name: 'Admin',
      isAppAdmin: true,
      passwordHash,
    },
  });
  console.log(`Person: ${person.email} (isAppAdmin: ${person.isAppAdmin})`);

  // 4. GalleryMembership
  await prisma.galleryMembership.upsert({
    where: { personId_galleryId: { personId: person.id, galleryId: gallery.id } },
    update: { isAdmin: true },
    create: { personId: person.id, galleryId: gallery.id, isAdmin: true },
  });
  console.log('GalleryMembership: ready');

  // 5. Sample works
  const works = [
    {
      title: 'Ridge Runner',
      slug: 'ridge-runner',
      status: Status.AVAILABLE,
      subject: 'Mustangs',
      tags: ['Mustang', 'Landscape'],
      year: 2024,
      dimensions: '36 × 48 in',
      medium: 'Oil on gallery wrap canvas',
      price: 8200,
      imageUrl: 'https://images.unsplash.com/photo-1517863829620-82f0f01ab8fb?auto=format&fit=crop&w=800&q=60',
      thumbUrl: 'https://images.unsplash.com/photo-1517863829620-82f0f01ab8fb?auto=format&fit=crop&w=400&q=60',
      fullResUrl: 'https://images.unsplash.com/photo-1517863829620-82f0f01ab8fb?auto=format&fit=crop&w=2400&q=80',
      featured: true,
      printsAvailable: true,
      description: 'A dramatic western landscape with a wild mustang cutting across the ridge line.',
      galleryId: gallery.id,
    },
    {
      title: 'High Country Evening',
      slug: 'high-country-evening',
      status: Status.SOLD,
      subject: 'Landscape',
      tags: ['Landscape', 'Sunset'],
      year: 2023,
      dimensions: '30 × 40 in',
      medium: 'Oil on canvas',
      price: null,
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
      thumbUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=60',
      fullResUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80',
      featured: false,
      printsAvailable: false,
      description: 'Sunset over a high country meadow with warm light on distant peaks.',
      galleryId: gallery.id,
    },
    {
      title: 'Quiet Stallion',
      slug: 'quiet-stallion',
      status: Status.AVAILABLE,
      subject: 'Equine',
      tags: ['Equine', 'Portrait'],
      year: 2024,
      dimensions: '24 × 30 in',
      medium: 'Oil on gallery wrap canvas',
      price: 4600,
      imageUrl: 'https://images.unsplash.com/photo-1449090918874-2ca33d65d708?auto=format&fit=crop&w=800&q=60',
      thumbUrl: 'https://images.unsplash.com/photo-1449090918874-2ca33d65d708?auto=format&fit=crop&w=400&q=60',
      fullResUrl: 'https://images.unsplash.com/photo-1449090918874-2ca33d65d708?auto=format&fit=crop&w=2400&q=80',
      featured: false,
      printsAvailable: true,
      description: 'A detailed portrait of a stallion captured in the quiet light of studio practice.',
      galleryId: gallery.id,
    },
    {
      title: 'Golden Sage Brush',
      slug: 'golden-sage-brush',
      status: Status.AVAILABLE,
      subject: 'Wildlife',
      tags: ['Sagebrush', 'Landscape'],
      year: 2022,
      dimensions: '18 × 24 in',
      medium: 'Oil on canvas',
      price: 3200,
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=60',
      thumbUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=60',
      fullResUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2400&q=80',
      featured: false,
      printsAvailable: true,
      description: 'A quiet wildlife scene with soft sagebrush and warm glowing light.',
      galleryId: gallery.id,
    },
    {
      title: "Collector's Path",
      slug: 'collectors-path',
      status: Status.NFS,
      subject: 'Portrait',
      tags: ['Portrait', 'Study'],
      year: 2023,
      dimensions: '20 × 26 in',
      medium: 'Oil on gallery wrap canvas',
      price: null,
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=60',
      thumbUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=60',
      fullResUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=2400&q=80',
      featured: false,
      printsAvailable: false,
      description: 'A thoughtful portrait study in muted tonal range and warm studio light.',
      galleryId: gallery.id,
    },
  ];

  for (const work of works) {
    await prisma.work.upsert({
      where: { slug: work.slug },
      update: {},
      create: work,
    });
  }
  console.log(`Works: ${works.length} sample works seeded`);

  console.log('\nDev seed complete. Login:', email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
