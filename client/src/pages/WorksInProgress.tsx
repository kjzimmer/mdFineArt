import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, normalizeWorks } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';
import MediaLightbox from '../components/shared/MediaLightbox';
import type { DigitalAsset, Work } from '../types';

export default function WorksInProgress() {
  const { config } = useSiteConfig();
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [covers, setCovers] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [openWork, setOpenWork] = useState<Work | null>(null);
  const [photos, setPhotos] = useState<DigitalAsset[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!config.worksInProgressEnabled) { setLoading(false); return; }
    apiFetch<unknown[]>('/api/works?includeInProgress=true&status=IN_PROGRESS')
      .then(normalizeWorks)
      .then(async (list) => {
        setWorks(list);
        const entries = await Promise.all(list.map(async (w) => {
          try {
            const p = await apiFetch<DigitalAsset[]>(`/api/works/${w.slug}/progress-photos`);
            return [w.id, p[0]?.thumbUrl] as const;
          } catch {
            return [w.id, undefined] as const;
          }
        }));
        setCovers(Object.fromEntries(entries));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [config.worksInProgressEnabled]);

  useEffect(() => {
    if (!slug || works.length === 0) return;
    const work = works.find((w) => w.slug === slug);
    if (work) openPhotos(work);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, works]);

  const openPhotos = async (work: Work) => {
    setOpenWork(work);
    try {
      const p = await apiFetch<DigitalAsset[]>(`/api/works/${work.slug}/progress-photos`);
      setPhotos(p);
      setLightboxIndex(p.length > 0 ? 0 : null);
    } catch {
      setPhotos([]);
    }
    navigate(`/works-in-progress/${work.slug}`, { replace: true });
  };

  const close = () => {
    setOpenWork(null);
    setPhotos([]);
    setLightboxIndex(null);
    navigate('/works-in-progress', { replace: true });
  };

  if (!config.worksInProgressEnabled) {
    return <p className="text-text/60">Nothing to see here.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Works in Progress</p>
        <h1 className="section-heading mt-3 text-4xl font-semibold text-text">Follow along</h1>
      </div>

      {loading ? (
        <p className="text-text/70">Loading…</p>
      ) : works.length === 0 ? (
        <p className="text-text/60">Nothing in progress right now — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {works.map((work) => (
            <button
              key={work.id}
              type="button"
              onClick={() => openPhotos(work)}
              className="group text-left"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-surface">
                {covers[work.id]
                  ? <img src={covers[work.id]} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  : <div className="flex h-full w-full items-center justify-center text-xs text-text/40">In Progress</div>
                }
              </div>
              <p className="mt-2 text-sm font-medium text-text">{work.title || 'Untitled'}</p>
            </button>
          ))}
        </div>
      )}

      {openWork && lightboxIndex !== null && (
        <MediaLightbox
          images={photos.map((p) => ({ url: p.imageUrl, caption: p.caption }))}
          index={lightboxIndex}
          onClose={close}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
