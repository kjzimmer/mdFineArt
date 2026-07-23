import { NavLink } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { detectPlatform } from '../../config/socialPlatforms';

export function TopNav() {
  const { config } = useSiteConfig();

  const navItems = [
    { label: 'About', to: '/about' },
    { label: 'Gallery', to: '/gallery' },
    ...(config.eventsEnabled ? [{ label: 'Events', to: '/events' }] : []),
    ...(config.musicEnabled ? [{ label: 'Music', to: '/music' }] : []),
    { label: 'Classes', to: '/classes' },
    ...(config.blogEnabled ? [{ label: 'Blog', to: '/blog' }] : []),
    ...(config.commissionsEnabled ? [{ label: 'Commissions', to: '/commission' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <NavLink to="/" className="text-lg font-semibold tracking-[0.2em] text-text/90 uppercase">
            {config.siteTitle}
          </NavLink>
          {config.socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {config.socialLinks.map((link) => {
                const platform = detectPlatform(link.url);
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    aria-label={platform.label}
                    style={{ color: platform.color }}
                    className="transition hover:opacity-70">
                    {platform.icon}
                  </a>
                );
              })}
            </div>
          )}
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
