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
  name: string;
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
  classesEnabled: boolean;
  showPrice: boolean;
  mediaTypes: string[];
  worksLabel: string;
  theme: string;

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
  classesLabel: string;
  classesHeading: string;
  classesImageUrl: string | null;
}

export const defaultConfig: SiteConfig = {
  name: '',
  taglinePrimary: '',
  taglineSecondary: '',
  taglineFooter: '',
  heroImageUrl: null,
  socialLinks: [],
  commissionsEnabled: false,
  commissionTitle: '',
  commissionBody: [],
  featuredEnabled: false,
  featuredCount: 6,
  newsletterEnabled: false,
  newsletterTitle: '',
  newsletterTagline: '',
  eventsEnabled: false,
  blogEnabled: false,
  musicEnabled: false,
  classesEnabled: false,
  showPrice: false,
  mediaTypes: [],
  worksLabel: '',
  theme: 'dark-western',
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
  classesLabel: '',
  classesHeading: '',
  classesImageUrl: null,
};

const SiteConfigContext = createContext<{
  config: SiteConfig;
  refresh: () => Promise<void>;
}>({ config: defaultConfig, refresh: async () => {} });

function mergeWithDefaults(data: Record<string, unknown>): SiteConfig {
  return {
    ...defaultConfig,
    ...data,
    name: (data.name as string) || defaultConfig.name,
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
    classesLabel: (data.classesLabel as string) || '',
    classesHeading: (data.classesHeading as string) || '',
    classesImageUrl: (data.classesImageUrl as string) || null,
    mediaTypes: Array.isArray(data.mediaTypes) ? data.mediaTypes as string[] : [],
    worksLabel: (data.worksLabel as string) || '',
    theme: (data.theme as string) || 'dark-western',
  };
}

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  const load = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = mergeWithDefaults(await res.json());
        setConfig(data);
        if (data.name) document.title = data.name;
        document.documentElement.dataset.theme = data.theme || 'dark-western';
      }
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
