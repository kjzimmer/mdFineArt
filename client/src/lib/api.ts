import type { Painting } from '../types';

// Access token lives in memory only — never localStorage or sessionStorage
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) { _accessToken = token; }

export async function apiFetch<T>(input: RequestInfo, init?: RequestInit, _retry = false): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  if (typeof init?.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(input, { ...init, headers, credentials: 'include' });

  if (response.status === 401 && _accessToken && !_retry) {
    // Access token expired — attempt silent refresh via HttpOnly cookie
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      const { accessToken } = await refreshed.json();
      setAccessToken(accessToken);
      return apiFetch(input, init, true);
    } else {
      setAccessToken(null);
      window.location.href = '/admin';
      throw new Error('Session expired');
    }
  }

  if (response.status === 401) {
    setAccessToken(null);
    window.location.href = '/admin';
    throw new Error('Session expired');
  }

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
