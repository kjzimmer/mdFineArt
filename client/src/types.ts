export type Subject = 'Mustangs' | 'Wildlife' | 'Landscape' | 'Equine' | 'Portrait' | string;

export interface Painting {
  id: string;
  title: string;
  slug: string;
  status: 'Available' | 'Sold' | 'NFS' | 'Reserved';
  subject: Subject;
  tags: string[];
  year?: number;
  dimensions?: string;
  medium?: string;
  price?: number | null;
  priceLabel?: string | null;
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

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  tags: string[];
  draft?: boolean;
}
