import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Galleries', path: '/app-admin' },
];

export function AppAdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/app-admin');
  };

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden">
      {/* Left nav */}
      <nav className="w-60 shrink-0 flex flex-col border-r border-border bg-surface">
        <div className="px-6 py-6 border-b border-border">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text/60">Gallery Platform</p>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-accent/70">Platform Admin</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const active = item.path === '/app-admin'
              ? location.pathname === '/app-admin' || location.pathname === '/app-admin/'
              : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-6 py-2.5 text-sm uppercase tracking-[0.14em] border-l-2 transition ${
                  active
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-transparent text-text/60 hover:text-text hover:bg-white/[0.03]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5 border-t border-border">
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-[0.2em] text-text/50 transition hover:text-text"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
