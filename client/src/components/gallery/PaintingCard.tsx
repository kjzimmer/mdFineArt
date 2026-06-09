import type { Painting } from '../../types';
import { galleryConfig } from '../../config/gallery';

export function PaintingCard({
  painting,
  onView,
}: {
  painting: Painting;
  onView?: (p: Painting) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-surface/80 shadow-soft transition hover:-translate-y-1 hover:border-accent/80">
      <div className="relative overflow-hidden bg-[#1f1b17]">
        <img
          src={painting.image}
          alt={painting.title}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {galleryConfig.showSubject && (
          <span className="absolute left-4 top-4 rounded-full bg-bg/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-text/70 backdrop-blur-sm">
            {painting.subject}
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="section-heading text-xl font-semibold text-text">{painting.title}</h3>
          <p className="mt-2 text-sm text-text/70">{painting.dimensions} · {painting.medium}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm uppercase tracking-[0.18em] text-text/80">{painting.year}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${painting.status === 'Available' ? 'bg-success/10 text-success' : painting.status === 'Sold' ? 'bg-sold/10 text-sold' : 'bg-text/10 text-text'}`}>
            {painting.status === 'NFS' ? 'NFS' : painting.status}
          </span>
        </div>
        <p className="text-base text-text/90">{painting.description}</p>
        <div className="flex items-center justify-between gap-4 text-sm text-text/80">
          <span>{painting.price != null ? `$${painting.price.toLocaleString()}` : 'Price upon request'}</span>
          <button
            onClick={() => onView?.(painting)}
            className="rounded-full border border-accent/70 bg-accent/5 px-4 py-2 text-accent transition hover:bg-accent/15"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}
