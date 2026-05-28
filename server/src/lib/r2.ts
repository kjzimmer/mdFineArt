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

  const sharpOpts = { sequentialRead: true, limitInputPixels: false } as const;

  // Derive WebP derivatives first — if Sharp fails, nothing lands in R2
  const fullResWebP = await sharp(buffer, sharpOpts)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const thumbWebP = await sharp(buffer, sharpOpts)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // All three uploads in parallel — Sharp already confirmed the image is valid
  const [fullResUrl, imageUrl, thumbUrl] = await Promise.all([
    putObject(`originals/${id}${ext}`, buffer, mimetype),
    putObject(`paintings/${id}-full.webp`, fullResWebP, 'image/webp'),
    putObject(`paintings/${id}-thumb.webp`, thumbWebP, 'image/webp'),
  ]);

  return { imageUrl, thumbUrl, fullResUrl };
}
