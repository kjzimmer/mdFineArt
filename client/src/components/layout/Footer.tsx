import { useSiteConfig } from '../../context/SiteConfigContext';

export function Footer() {
  const { config } = useSiteConfig();
  return (
    <footer className="border-t border-border bg-bg/95 text-sm text-text/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <p>© {new Date().getFullYear()} {config.name}. All rights reserved.</p>
        {config.taglineFooter && <p>{config.taglineFooter}</p>}
      </div>
      <div className="border-t border-border/50 px-4 py-4 text-center text-xs text-text/50">
        <a
          href="https://mygalleryworks.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-accent"
        >
          Powered by MyGalleryWorks.com
        </a>
      </div>
    </footer>
  );
}
