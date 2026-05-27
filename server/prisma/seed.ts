import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

const paintings = [
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
    priceLabel: '$8,200',
    imageUrl: 'https://images.unsplash.com/photo-1517863829620-82f0f01ab8fb?auto=format&fit=crop&w=800&q=60',
    fullResUrl: 'https://images.unsplash.com/photo-1517863829620-82f0f01ab8fb?auto=format&fit=crop&w=2400&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1517863829620-82f0f01ab8fb?auto=format&fit=crop&w=800&q=60',
    printsAvailable: true,
    featured: true,
    description: 'A dramatic western landscape with a wild mustang cutting across the ridge line.',
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
    priceLabel: null,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
    fullResUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
    printsAvailable: false,
    featured: false,
    description: 'Sunset over a high country meadow with warm light on distant peaks.',
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
    priceLabel: '$4,600',
    imageUrl: 'https://images.unsplash.com/photo-1449090918874-2ca33d65d708?auto=format&fit=crop&w=800&q=60',
    fullResUrl: 'https://images.unsplash.com/photo-1449090918874-2ca33d65d708?auto=format&fit=crop&w=2400&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1449090918874-2ca33d65d708?auto=format&fit=crop&w=800&q=60',
    printsAvailable: true,
    featured: false,
    description: 'A detailed portrait of a stallion captured in the quiet light of studio practice.',
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
    priceLabel: '$3,200',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=60',
    fullResUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2400&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=60',
    printsAvailable: true,
    featured: false,
    description: 'A quiet wildlife scene with soft sagebrush and warm glowing light.',
  },
  {
    title: 'Collector’s Path',
    slug: 'collectors-path',
    status: Status.NFS,
    subject: 'Portrait',
    tags: ['Portrait', 'Study'],
    year: 2023,
    dimensions: '20 × 26 in',
    medium: 'Oil on gallery wrap canvas',
    price: null,
    priceLabel: null,
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=60',
    fullResUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=2400&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=60',
    printsAvailable: false,
    featured: false,
    description: 'A thoughtful portrait study in muted tonal range and warm studio light.',
  },
];

async function main() {
  console.log('Seeding paintings...');
  await prisma.painting.deleteMany();
  await prisma.painting.createMany({
    data: paintings,
  });
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
