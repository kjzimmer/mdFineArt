import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Gallery', to: '/gallery' },
  { label: 'Blog', to: '/blog' },
  { label: 'Commission', to: '/commission' },
  { label: 'Events', to: '/events' },
  { label: 'Music', to: '/music' },
  { label: 'Contact', to: '/contact' },
];

export function TopNav() {
  return (
    <header className="border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <NavLink to="/" className="text-lg font-semibold tracking-[0.2em] text-text/90 uppercase">
          Melody DeBenedictis
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm uppercase tracking-[0.16em] transition ${isActive ? 'text-accent' : 'text-text/75 hover:text-text'}`
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
