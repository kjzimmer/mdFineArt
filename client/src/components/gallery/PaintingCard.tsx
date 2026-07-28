import type { Work } from '../../types';
import { galleryConfig } from '../../config/gallery';
import { useSiteConfig } from '../../context/SiteConfigContext';

export function WorkCard({
  work,
  onView,
}: {
  work: Work;
  onView?: (w: Work) => void;
}) {
  const { config } = useSiteConfig();
  return (
    <article
      className="group overflow-hidden rounded-3xl border border-border bg-surface/80 shadow-soft transition hover:-translate-y-1 hover:border-accent/80 cursor-pointer"
      onClick={() => onView?.(work)}
    >
      <div className="relative overflow-hidden bg-surface-raised">
        <img
          src={work.image}
          alt={work.title}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {galleryConfig.showSubject && work.subject && (
          <span className="absolute left-4 top-4 rounded-full bg-bg/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-text/70 backdrop-blur-sm">
            {work.subject}
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="section-heading text-xl font-semibold text-text">{work.title}</h3>
          <p className="mt-2 text-sm text-text/70">{[work.dimensions, work.medium].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm uppercase tracking-[0.18em] text-text/80">{work.year}</p>
          <div className="flex flex-col items-end gap-1">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${work.status === 'Available' ? 'bg-success/10 text-success' : work.status === 'Sold' ? 'bg-sold/10 text-sold' : 'bg-text/10 text-text'}`}>
              {work.status === 'NFS' ? 'NFS' : work.status}
            </span>
            {work.printsAvailable && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Prints available
              </span>
            )}
          </div>
        </div>
        <p className="text-base text-text/90">{work.description}</p>
        <div className="flex items-center justify-between gap-4 text-sm text-text/80">
          {config.showPrice && <span>{work.price != null ? `$${work.price.toLocaleString()}` : 'Price upon request'}</span>}
          <button
            onClick={(e) => { e.stopPropagation(); onView?.(work); }}
            className="rounded-full border border-accent/70 bg-accent/5 px-4 py-2 text-accent transition hover:bg-accent/15"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

// Legacy export kept so any remaining callers don't break during migration
export const PaintingCard = WorkCard;
