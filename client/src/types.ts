export type Subject = string;

export interface Work {
  id: string;
  title: string;
  slug: string;
  status: 'Available' | 'Sold' | 'NFS' | 'Reserved';
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
  description?: string;
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
