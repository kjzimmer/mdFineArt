import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export interface UploadResult {
  imageUrl: string;   // 2400px WebP — lightbox / large display
  thumbUrl: string;   // 800px WebP  — gallery grid / admin thumbnails
  fullResUrl: string; // original file (TIFF/JPEG/etc) — archival + print production
}

export async function uploadPainting(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<UploadResult> {
  const id = crypto.randomUUID();
  const ext = path.extname(filename).toLowerCase() || '.jpg';

  // Store original for archival and future print-on-demand use
  const fullResUrl = await putObject(`originals/${id}${ext}`, buffer, mimetype);

  // Full-res WebP: max 2400px wide, for lightbox display
  const fullResWebP = await sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const imageUrl = await putObject(`paintings/${id}-full.webp`, fullResWebP, 'image/webp');

  // Thumbnail WebP: max 800px wide, for gallery grid
  const thumbWebP = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbUrl = await putObject(`paintings/${id}-thumb.webp`, thumbWebP, 'image/webp');

  return { imageUrl, thumbUrl, fullResUrl };
}
