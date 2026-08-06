import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';

export type AdminTab = 'analytics' | 'people' | 'contact' | 'works' | 'commissions' | 'orders' | 'blog' | 'newsletter' | 'events' | 'classes' | 'config';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  uploadProgress?: { current: number; total: number } | null;
}

const FONT_SIZES = { small: 14, medium: 16, large: 18 } as const;
type FontSizeKey = keyof typeof FONT_SIZES;
const FONT_SIZE_STORAGE_KEY = 'admin_font_size';

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const { logout } = useAuth();
  const { config } = useSiteConfig();
  const [fontSize, setFontSize] = useState<FontSizeKey>(
    () => (localStorage.getItem(FONT_SIZE_STORAGE_KEY) as FontSizeKey) || 'medium'
  );

  // Scales all rem-based Tailwind sizing proportionally while in admin — same pattern the
  // theme system uses (mutating document.documentElement), reset on unmount so the public
  // site is never affected.
  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SIZES[fontSize]}px`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    return () => { document.documentElement.style.fontSize = ''; };
  }, [fontSize]);

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'people', label: 'People' },
    { id: 'contact', label: 'Inbox' },
    { id: 'works', label: 'Works' },
    ...(config.commissionsEnabled ? [{ id: 'commissions' as AdminTab, label: 'Commissions' }] : []),
    { id: 'orders', label: 'Orders' },
    ...(config.blogEnabled ? [{ id: 'blog' as AdminTab, label: 'Blog' }] : []),
    ...(config.newsletterEnabled ? [{ id: 'newsletter' as AdminTab, label: 'Newsletter' }] : []),
    ...(config.eventsEnabled ? [{ id: 'events' as AdminTab, label: 'Events' }] : []),
    ...(config.classesEnabled ? [{ id: 'classes' as AdminTab, label: 'Classes' }] : []),
    { id: 'config', label: 'Configuration' },
  ];

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden">
      {/* Left nav — 240px fixed */}
      <nav className="w-60 shrink-0 flex flex-col border-r border-border bg-surface">
        {/* Site name */}
        <div className="px-6 py-6 border-b border-border">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-text/60 hover:text-text transition"
          >
            {config.name || 'Gallery Admin'}
          </a>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-text/40">Admin</p>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-6 py-2.5 text-sm uppercase tracking-[0.14em] border-l-2 transition ${
                activeTab === tab.id
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text/60 hover:text-text hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Text size + Logout pinned to bottom */}
        <div className="px-6 py-5 border-t border-border space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text/40 mb-1.5">Text size</p>
            <div className="flex gap-1">
              {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setFontSize(key)}
                  className={`flex-1 rounded-md border py-1 text-xs uppercase tracking-wide transition ${
                    fontSize === key
                      ? 'border-accent text-accent bg-accent/5'
                      : 'border-border text-text/50 hover:text-text'
                  }`}
                >
                  {key === 'small' ? 'S' : key === 'medium' ? 'M' : 'L'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs uppercase tracking-[0.2em] text-text/50 transition hover:text-text"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main content — scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
