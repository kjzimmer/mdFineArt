import { createContext, useContext, useEffect, useState } from 'react';

export interface SocialLink {
  id: string;
  url: string;
  position: number;
}

export interface SiteConfig {
  siteTitle: string;
  taglinePrimary: string;
  taglineSecondary: string;
  taglineFooter: string;
  heroImageUrl: string | null;
  socialLinks: SocialLink[];
  commissionsEnabled: boolean;
  commissionTitle: string;
  commissionBody: string[];
  featuredEnabled: boolean;
  featuredCount: number;
  newsletterEnabled: boolean;
  eventsEnabled: boolean;
  showPrice: boolean;
}

export const defaultConfig: SiteConfig = {
  siteTitle: 'Melody De Benedictis',
  taglinePrimary: 'Painter of the West and Its Wild',
  taglineSecondary: 'Bold color, quiet storytelling, deep atmosphere.',
  taglineFooter: 'Hand-painted Western oil paintings, commissions, and studio journal.',
  heroImageUrl: null,
  socialLinks: [],
  commissionsEnabled: true,
  commissionTitle: 'Create a custom western painting for your collection.',
  commissionBody: [
    'Melody accepts commission inquiries for original paintings in a range of sizes and western themes. Start with a concept, reference photos, or a story you want captured in oil.',
    "We'll refine the idea, agree on a budget and timeline, and work together through sketch, progress updates, and final delivery.",
  ],
  featuredEnabled: true,
  featuredCount: 6,
  newsletterEnabled: true,
  eventsEnabled: true,
  showPrice: true,
};

const SiteConfigContext = createContext<{
  config: SiteConfig;
  refresh: () => Promise<void>;
}>({ config: defaultConfig, refresh: async () => {} });

function mergeWithDefaults(data: Record<string, unknown>): SiteConfig {
  return {
    ...defaultConfig,
    ...data,
    siteTitle: (data.siteTitle as string) || defaultConfig.siteTitle,
    taglinePrimary: (data.taglinePrimary as string) || defaultConfig.taglinePrimary,
    taglineSecondary: (data.taglineSecondary as string) || defaultConfig.taglineSecondary,
    taglineFooter: (data.taglineFooter as string) || defaultConfig.taglineFooter,
    heroImageUrl: (data.heroImageUrl as string | null) ?? null,
    socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks as SocialLink[] : [],
    commissionTitle: (data.commissionTitle as string) || defaultConfig.commissionTitle,
    commissionBody: Array.isArray(data.commissionBody) && (data.commissionBody as string[]).length > 0
      ? data.commissionBody as string[]
      : defaultConfig.commissionBody,
  };
}

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  const load = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) setConfig(mergeWithDefaults(await res.json()));
    } catch {}
  };

  useEffect(() => { load(); }, []);

  return (
    <SiteConfigContext.Provider value={{ config, refresh: load }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() { return useContext(SiteConfigContext); }
