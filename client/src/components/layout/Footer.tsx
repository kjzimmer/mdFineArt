import { useSiteConfig } from '../../context/SiteConfigContext';

export function Footer() {
  const { config } = useSiteConfig();
  return (
    <footer className="border-t border-border bg-bg/95 text-sm text-text/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <p>© {new Date().getFullYear()} {config.siteTitle}. All rights reserved.</p>
        {config.taglineFooter && <p>{config.taglineFooter}</p>}
      </div>
    </footer>
  );
}
