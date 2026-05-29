import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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

function urlToKey(url: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  return url.replace(`${base}/`, '');
}

export async function deleteObjects(urls: (string | null | undefined)[]): Promise<void> {
  await Promise.allSettled(
    urls
      .filter((u): u is string => !!u)
      .map((url) =>
        client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: urlToKey(url),
        }))
      )
  );
}

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
  imageUrl: string;   // 2400px WebP + watermark — lightbox / large display
  thumbUrl: string;   // 800px WebP + watermark  — gallery grid / admin thumbnails
  fullResUrl: string; // original file, no watermark — archival + print production
}

function watermarkSvg(width: number, height: number): Buffer {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const fontSize = Math.max(16, Math.floor(Math.min(width, height) * 0.055));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text x="${cx}" y="${cy}"
        text-anchor="middle" dominant-baseline="middle"
        font-size="${fontSize}" font-family="DejaVu Sans,Arial,sans-serif"
        fill="white" fill-opacity="0.28"
        transform="rotate(-25 ${cx} ${cy})">Melody DeBenedictis</text>
    </svg>`
  );
}

export async function uploadPainting(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<UploadResult> {
  const id = crypto.randomUUID();
  const ext = path.extname(filename).toLowerCase() || '.jpg';
  const sharpOpts = { sequentialRead: true, limitInputPixels: false } as const;

  // Resize first, capture output dimensions, then composite watermark.
  // Two-pass per size: resize → PNG intermediate → watermark → WebP.
  // PNG intermediate avoids re-reading the original TIFF a second time and
  // gives Sharp clean dimensions for the SVG composite.
  const { data: fullData, info: fullInfo } = await sharp(buffer, sharpOpts)
    .resize({ width: 2400, withoutEnlargement: true })
    .png({ compressionLevel: 1 })
    .toBuffer({ resolveWithObject: true });

  const fullResWebP = await sharp(fullData)
    .composite([{ input: watermarkSvg(fullInfo.width, fullInfo.height), blend: 'over' }])
    .webp({ quality: 85 })
    .toBuffer();

  const { data: thumbData, info: thumbInfo } = await sharp(buffer, sharpOpts)
    .resize({ width: 800, withoutEnlargement: true })
    .png({ compressionLevel: 1 })
    .toBuffer({ resolveWithObject: true });

  const thumbWebP = await sharp(thumbData)
    .composite([{ input: watermarkSvg(thumbInfo.width, thumbInfo.height), blend: 'over' }])
    .webp({ quality: 80 })
    .toBuffer();

  // Upload all three in parallel — Sharp validated the source, nothing lands in R2 on failure
  const [fullResUrl, imageUrl, thumbUrl] = await Promise.all([
    putObject(`originals/${id}${ext}`, buffer, mimetype),
    putObject(`paintings/${id}-full.webp`, fullResWebP, 'image/webp'),
    putObject(`paintings/${id}-thumb.webp`, thumbWebP, 'image/webp'),
  ]);

  return { imageUrl, thumbUrl, fullResUrl };
}
