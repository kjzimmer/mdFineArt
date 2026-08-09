export type Subject = string;

export interface Work {
  id: string;
  title: string;
  slug: string;
  status: 'Available' | 'Sold' | 'NFS' | 'Reserved' | 'In Progress';
  subject: string;
  mediaType?: string | null;
  tags: string[];
  year?: number;
  dimensions?: string;
  medium?: string;
  price?: number | null;
  originalWidth?: number | null;
  originalHeight?: number | null;
  // image used for gallery thumbnails
  image: string;
  // higher-resolution image used for the lightbox / print processing
  fullRes?: string;
  fullResUrl?: string;
  thumbUrl?: string;
  featured?: boolean;
  printsAvailable?: boolean;
  showInGallery?: boolean;
  description?: string;
}

export interface DigitalAsset {
  id: string;
  imageUrl: string;
  thumbUrl: string;
  originalWidth: number | null;
  originalHeight: number | null;
  tags: string[];
  caption: string | null;
  createdAt: string;
  linkageId?: string;
  position?: number;
  linkages?: { id: string; role: string; work: { id: string; title: string | null; slug: string } | null }[];
}

export interface BulkUploadResult {
  created: number;
  skipped: string[];
  errors: { filename: string; error: string }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  tags: string[];
  draft?: boolean;
}
