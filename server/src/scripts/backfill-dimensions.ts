/**
 * One-time script: fetch each painting's original from R2, read pixel
 * dimensions with Sharp, and update the DB record.
 *
 * Run with:
 *   npx ts-node src/scripts/backfill-dimensions.ts
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

function printTier(w: number, h: number): 'large' | 'medium' | 'small' | 'none' {
  const s = Math.min(w, h);
  if (s >= 5000) return 'large';
  if (s >= 3000) return 'medium';
  if (s >= 1500) return 'small';
  return 'none';
}

async function main() {
  const paintings = await prisma.painting.findMany({
    where: {
      fullResUrl: { not: null },
      originalWidth: null,
    },
    select: { id: true, title: true, fullResUrl: true },
  });

  console.log(`Found ${paintings.length} paintings to backfill.`);
  if (!paintings.length) { console.log('Nothing to do.'); return; }

  let ok = 0; let failed = 0;

  for (const p of paintings) {
    try {
      if (!p.fullResUrl!.startsWith('http')) {
        console.log(`  skipped ${p.title}: no R2 URL (local path)`);
        failed++;
        continue;
      }
      const res = await fetch(p.fullResUrl!);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());

      const { width = 0, height = 0 } = await sharp(buffer, {
        sequentialRead: true,
        limitInputPixels: false,
      }).metadata();

      const tier = printTier(width, height);

      await prisma.painting.update({
        where: { id: p.id },
        data: {
          originalWidth: width,
          originalHeight: height,
          printsAvailable: tier !== 'none',
        },
      });

      console.log(`✓ ${p.title}: ${width}×${height}px (${tier})`);
      ok++;
    } catch (err) {
      console.error(`✗ ${p.title}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${ok} updated, ${failed} failed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
