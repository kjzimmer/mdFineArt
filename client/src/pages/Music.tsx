import { useSiteConfig } from '../context/SiteConfigContext';

export default function Music() {
  const { config } = useSiteConfig();
  const firstName = (config.aboutName || config.name).split(' ')[0];
  return (
    <div className="flex flex-col items-center justify-center rounded-section border border-border bg-surface/90 py-32 text-center shadow-soft">
      <p className="text-sm uppercase tracking-[0.4em] text-accent/80">Music</p>
      <h1 className="section-heading mt-4 text-4xl font-semibold text-text">Coming Soon</h1>
      <p className="mt-6 max-w-md leading-8 text-text/70">
        Songs, recordings, and studio music from {firstName}'s creative practice will appear here.
      </p>
    </div>
  );
}
