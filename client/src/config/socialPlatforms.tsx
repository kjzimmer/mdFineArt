import type { ReactNode } from 'react';

export interface SocialPlatform {
  key: string;
  label: string;
  color: string;       // CSS color for the icon
  icon: ReactNode;
  match: (url: string) => boolean;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const Facebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const X = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Pinterest = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.77-.17-1.96.04-2.8.18-.76 1.22-5.17 1.22-5.17s-.31-.63-.31-1.55c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.47 0 .9-.57 2.24-.87 3.48-.24 1.04.52 1.88 1.54 1.88 1.85 0 3.27-1.95 3.27-4.77 0-2.49-1.79-4.23-4.35-4.23-2.96 0-4.69 2.22-4.69 4.51 0 .89.34 1.85.77 2.37.08.1.09.19.07.29l-.29 1.18c-.05.19-.15.23-.35.14-1.3-.61-2.11-2.51-2.11-4.04 0-3.28 2.39-6.3 6.87-6.3 3.61 0 6.41 2.57 6.41 6.01 0 3.59-2.26 6.47-5.39 6.47-1.05 0-2.04-.55-2.38-1.19l-.65 2.47c-.24.9-.87 2.03-1.3 2.72.98.3 2.02.47 3.09.47 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const YouTube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
  </svg>
);

const TikTok = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.81 1.53V6.77a4.85 4.85 0 0 1-1.04-.08z" />
  </svg>
);

const LinkedIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Substack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 5H2v3h20V5zM2 10v11l10-5.5L22 21V10H2zm20-7H2v2h20V3z" />
  </svg>
);

const Patreon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="14.5" cy="9.5" r="6.5" />
    <rect x="2" y="2" width="4" height="20" />
  </svg>
);

const Etsy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm2 5v10h7v-2H9v-2.5h4v-2H9V9h5V7H7z" />
  </svg>
);

const Threads = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068c0-3.52.85-6.374 2.495-8.421C5.845 1.213 8.598.024 12.18 0h.014c2.746.018 5.145.87 6.924 2.465 1.79 1.604 2.87 3.944 3.206 6.959l.03.277h-3.055l-.024-.243c-.27-2.378-1.053-4.141-2.325-5.243-1.205-1.044-2.892-1.582-4.85-1.582h-.006c-2.531.018-4.571.886-6.065 2.578C4.54 6.901 3.765 9.247 3.765 12.068c0 2.821.775 5.167 2.24 6.857 1.494 1.692 3.534 2.56 6.065 2.578h.006c2.013.015 3.63-.48 4.812-1.471 1.322-1.105 1.993-2.778 2.075-5.114l.014-.389H14.7v-.002c0 1.508-.28 2.665-.833 3.44-.506.7-1.263 1.061-2.25 1.073h-.042c-.955-.015-1.668-.355-2.12-1.01-.418-.604-.63-1.472-.63-2.582 0-2.432 1.276-3.869 3.403-3.869.648 0 1.184.118 1.594.35.49.282.798.728.917 1.33l.07.357h2.83l-.064-.48c-.205-1.538-.938-2.748-2.128-3.5-1.016-.637-2.27-.96-3.73-.96-3.664 0-6.076 2.329-6.076 5.94 0 1.652.4 3.025 1.189 4.082.88 1.178 2.185 1.827 3.782 1.878h.043c1.376-.016 2.535-.466 3.355-1.303.72-.735 1.134-1.73 1.236-2.96h-.006v.003z" />
  </svg>
);

const Bluesky = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
  </svg>
);

const Vimeo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.48 4.807z" />
  </svg>
);

const ExternalLink = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ── Registry ─────────────────────────────────────────────────────────────────

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2', icon: <Facebook />,  match: (u) => u.includes('facebook.com') },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: <Instagram />, match: (u) => u.includes('instagram.com') },
  { key: 'x',         label: 'X',         color: '#e2e8f0', icon: <X />,         match: (u) => u.includes('x.com') || u.includes('twitter.com') },
  { key: 'pinterest', label: 'Pinterest', color: '#E60023', icon: <Pinterest />, match: (u) => u.includes('pinterest.com') },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000', icon: <YouTube />,   match: (u) => u.includes('youtube.com') || u.includes('youtu.be') },
  { key: 'tiktok',    label: 'TikTok',    color: '#e2e8f0', icon: <TikTok />,    match: (u) => u.includes('tiktok.com') },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2', icon: <LinkedIn />,  match: (u) => u.includes('linkedin.com') },
  { key: 'substack',  label: 'Substack',  color: '#FF6719', icon: <Substack />,  match: (u) => u.includes('substack.com') },
  { key: 'patreon',   label: 'Patreon',   color: '#FF424D', icon: <Patreon />,   match: (u) => u.includes('patreon.com') },
  { key: 'etsy',      label: 'Etsy',      color: '#F45800', icon: <Etsy />,      match: (u) => u.includes('etsy.com') },
  { key: 'threads',   label: 'Threads',   color: '#e2e8f0', icon: <Threads />,   match: (u) => u.includes('threads.net') },
  { key: 'bluesky',   label: 'Bluesky',   color: '#0085FF', icon: <Bluesky />,   match: (u) => u.includes('bsky.app') || u.includes('bluesky.social') },
  { key: 'vimeo',     label: 'Vimeo',     color: '#1AB7EA', icon: <Vimeo />,     match: (u) => u.includes('vimeo.com') },
];

export const GENERIC_PLATFORM: SocialPlatform = {
  key: 'link',
  label: 'Link',
  color: '#94a3b8',
  icon: <ExternalLink />,
  match: () => true,
};

export function detectPlatform(url: string): SocialPlatform {
  const lower = url.toLowerCase();
  return SOCIAL_PLATFORMS.find((p) => p.match(lower)) ?? GENERIC_PLATFORM;
}
