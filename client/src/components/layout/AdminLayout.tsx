import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';

export type AdminTab = 'analytics' | 'people' | 'contact' | 'works' | 'commissions' | 'orders' | 'blog' | 'events' | 'classes' | 'config';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  uploadProgress?: { current: number; total: number } | null;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const { logout } = useAuth();
  const { config } = useSiteConfig();

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'people', label: 'People' },
    { id: 'contact', label: 'Inbox' },
    { id: 'works', label: 'Works' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'orders', label: 'Orders' },
    { id: 'blog', label: 'Blog' },
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

        {/* Logout pinned to bottom */}
        <div className="px-6 py-5 border-t border-border">
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
