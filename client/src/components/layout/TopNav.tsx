import { NavLink } from 'react-router-dom';

const FACEBOOK_URL = 'https://www.facebook.com/artistmelodydebenedictis/';
const INSTAGRAM_URL = 'https://www.instagram.com/melody.a.debenedictis/';

const navItems = [
  { label: 'About', to: '/about' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Events', to: '/events' },
  { label: 'Music', to: '/music' },
  { label: 'Classes', to: '/classes' },
  { label: 'Blog', to: '/blog' },
  { label: 'Commissions', to: '/commission' },
];

function IconFacebook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <NavLink to="/" className="text-lg font-semibold tracking-[0.2em] text-text/90 uppercase">
            Melody De Benedictis
          </NavLink>
          <div className="flex items-center gap-3">
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer"
              className="text-[#1877F2] transition hover:text-accent" aria-label="Facebook">
              <IconFacebook />
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="text-[#E1306C] transition hover:text-accent" aria-label="Instagram">
              <IconInstagram />
            </a>
          </div>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm uppercase tracking-[0.16em] transition ${isActive ? 'text-accent' : 'text-text/75 hover:text-accent'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
