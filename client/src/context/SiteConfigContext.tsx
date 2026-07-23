import { createContext, useContext, useEffect, useState } from 'react';

export interface SocialLink {
  id: string;
  url: string;
  position: number;
}

export interface AboutShow { year: number; name: string; location: string; }
export interface AboutAward { year: number; award: string; event: string; location: string; }
export interface AboutMedia { year: number; title: string; }
export interface AboutGallery { year: number; name: string; location: string; }
export interface AboutMembership { name: string; level: string; logoUrl?: string; url?: string; }

export interface SiteConfig {
  // Landing Page
  siteTitle: string;
  taglinePrimary: string;
  taglineSecondary: string;
  taglineFooter: string;
  heroImageUrl: string | null;
  socialLinks: SocialLink[];

  // Site Features
  commissionsEnabled: boolean;
  commissionTitle: string;
  commissionBody: string[];
  featuredEnabled: boolean;
  featuredCount: number;
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterTagline: string;
  eventsEnabled: boolean;
  blogEnabled: boolean;
  musicEnabled: boolean;
  showPrice: boolean;

  // Site Info
  contactEmail: string;
  contactPhone: string;
  studioLocation: string;
  timezone: string;
  metaDescription: string;
  ogImageUrl: string;

  // Contact
  contactHeading: string;
  contactBody: string[];
  studioImageUrl: string;
  contactImageCaption: string;

  // About Page
  aboutName: string;
  aboutBioSubtitle: string;
  aboutBio: string[];
  aboutStatSubtitle: string;
  aboutStatement: string[];
  profileImageUrl: string | null;
  profileThumbUrl: string | null;
  profileFullResUrl: string | null;
  aboutStatImage1Url: string | null;
  aboutStatImage2Url: string | null;
  aboutShows: AboutShow[];
  aboutAwards: AboutAward[];
  aboutMedia: AboutMedia[];
  aboutGalleries: AboutGallery[];
  aboutMemberships: AboutMembership[];
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
  newsletterTitle: 'Stay connected',
  newsletterTagline: 'Get occasional updates on new work, shows, and studio news.',
  eventsEnabled: true,
  blogEnabled: false,
  musicEnabled: false,
  showPrice: true,
  contactEmail: '',
  contactPhone: '',
  studioLocation: '',
  timezone: '',
  metaDescription: '',
  ogImageUrl: '',
  contactHeading: '',
  contactBody: [],
  studioImageUrl: '',
  contactImageCaption: '',
  aboutName: '',
  aboutBioSubtitle: '',
  aboutBio: [],
  aboutStatSubtitle: '',
  aboutStatement: [],
  profileImageUrl: null,
  profileThumbUrl: null,
  profileFullResUrl: null,
  aboutStatImage1Url: null,
  aboutStatImage2Url: null,
  aboutShows: [],
  aboutAwards: [],
  aboutMedia: [],
  aboutGalleries: [],
  aboutMemberships: [],
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
    newsletterTitle: (data.newsletterTitle as string) || defaultConfig.newsletterTitle,
    newsletterTagline: (data.newsletterTagline as string) || defaultConfig.newsletterTagline,
    profileImageUrl: (data.profileImageUrl as string | null) ?? null,
    profileThumbUrl: (data.profileThumbUrl as string | null) ?? null,
    profileFullResUrl: (data.profileFullResUrl as string | null) ?? null,
    aboutStatImage1Url: (data.aboutStatImage1Url as string | null) ?? null,
    aboutStatImage2Url: (data.aboutStatImage2Url as string | null) ?? null,
    contactBody: Array.isArray(data.contactBody) ? data.contactBody as string[] : [],
    aboutBio: Array.isArray(data.aboutBio) ? data.aboutBio as string[] : [],
    aboutStatement: Array.isArray(data.aboutStatement) ? data.aboutStatement as string[] : [],
    aboutShows: Array.isArray(data.aboutShows) ? data.aboutShows as AboutShow[] : [],
    aboutAwards: Array.isArray(data.aboutAwards) ? data.aboutAwards as AboutAward[] : [],
    aboutMedia: Array.isArray(data.aboutMedia) ? data.aboutMedia as AboutMedia[] : [],
    aboutGalleries: Array.isArray(data.aboutGalleries) ? data.aboutGalleries as AboutGallery[] : [],
    aboutMemberships: Array.isArray(data.aboutMemberships) ? data.aboutMemberships as AboutMembership[] : [],
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
