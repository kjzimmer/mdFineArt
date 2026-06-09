import { useAuth } from '../../context/AuthContext';

export type AdminTab = 'paintings' | 'commissions' | 'contact' | 'blog' | 'events' | 'orders' | 'people';

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'paintings', label: 'Paintings' },
  { id: 'contact', label: 'Contact' },
  { id: 'people', label: 'People' },
  { id: 'blog', label: 'Blog' },
  { id: 'events', label: 'Events' },
  { id: 'orders', label: 'Orders' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  uploadProgress?: { current: number; total: number } | null;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-text/60">
            MD Fine Art · Admin
          </span>
          <button
            onClick={logout}
            className="text-xs uppercase tracking-[0.2em] text-text/50 transition hover:text-text"
          >
            Log out
          </button>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`border-b-2 px-4 py-3 text-sm uppercase tracking-[0.14em] transition ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text/60 hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
