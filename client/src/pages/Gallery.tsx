import { useEffect, useMemo, useState } from 'react';
import { GalleryGrid } from '../components/gallery/GalleryGrid';
import { apiFetch, normalizeWorks } from '../lib/apiFetch';
import { galleryConfig } from '../config/gallery';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { Work } from '../types';

const statuses = ['All', 'Available', 'Sold', 'NFS'] as const;

export default function Gallery() {
  const { config } = useSiteConfig();
  const [subject, setSubject] = useState<string>('All');
  const [status, setStatus] = useState<typeof statuses[number]>('All');
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<unknown[]>('/api/works')
      .then(normalizeWorks)
      .then(setWorks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const subjects = useMemo(() => {
    const seen = new Set<string>();
    works.forEach((w) => { if (w.subject) seen.add(w.subject); });
    return ['All', ...Array.from(seen).sort()];
  }, [works]);

  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      const subjectMatch = !galleryConfig.showSubject || subject === 'All' || work.subject === subject;
      const statusMatch = status === 'All' || work.status === status;
      return subjectMatch && statusMatch;
    });
  }, [works, subject, status]);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Gallery</p>
            <h1 className="section-heading mt-3 text-4xl font-semibold text-text">{config.worksLabel || 'Works'}</h1>
          </div>
          <p className="max-w-2xl text-text/75">
            Browse by availability or explore the full collection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-start">
          {galleryConfig.showSubject && (
            <div className="flex flex-wrap gap-2 mr-auto">
              {subjects.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${subject === item ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg text-text/80 hover:border-accent hover:text-accent'}`}>
                  {item}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {statuses.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${status === option ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg text-text/80 hover:border-accent hover:text-accent'}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>
      {loading ? <p className="text-text/70">Loading gallery…</p> : <GalleryGrid works={filteredWorks} />}
    </div>
  );
}
