import type { Painting } from '../types';

export async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(input, { ...init, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${body}`);
  }
  return response.json();
}

function normalizeStatus(status: unknown): Painting['status'] {
  if (typeof status !== 'string') return 'Available';
  const normalized = status.toUpperCase();
  if (normalized === 'SOLD') return 'Sold';
  if (normalized === 'RESERVED') return 'Reserved';
  if (normalized === 'NFS') return 'NFS';
  return 'Available';
}

export function normalizePainting(input: any): Painting {
  return {
    id: String(input.id),
    title: String(input.title ?? ''),
    slug: String(input.slug ?? ''),
    status: normalizeStatus(input.status),
    subject: String(input.subject ?? 'Landscape'),
    tags: Array.isArray(input.tags) ? input.tags : [],
    year: input.year != null ? Number(input.year) : undefined,
    dimensions: input.dimensions ?? '',
    medium: input.medium ?? '',
    price: input.price != null ? Number(input.price) : null,
    originalWidth: input.originalWidth != null ? Number(input.originalWidth) : null,
    originalHeight: input.originalHeight != null ? Number(input.originalHeight) : null,
    image: input.imageUrl ?? input.image ?? '',
    fullRes: input.fullResUrl ?? input.fullRes ?? input.imageUrl ?? input.image ?? '',
    fullResUrl: input.fullResUrl ?? undefined,
    thumbUrl: input.thumbUrl ?? undefined,
    printsAvailable: Boolean(input.printsAvailable),
    featured: Boolean(input.featured),
    description: input.description ?? '',
  };
}

export function normalizePaintings(input: any[]): Painting[] {
  return Array.isArray(input) ? input.map(normalizePainting) : [];
}
