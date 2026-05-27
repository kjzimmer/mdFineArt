import { useEffect } from 'react';
import type { Painting } from '../../types';

export default function Lightbox({
  paintings,
  index,
  onClose,
  onNavigate,
}: {
  paintings: Painting[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const painting = paintings[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % paintings.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + paintings.length) % paintings.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose, onNavigate, paintings.length]);

  if (!painting) return null;

  const highRes = painting.fullRes ?? painting.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 rounded-3xl bg-bg p-6 md:grid-cols-[60%_1fr]">
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-black">
          <img src={highRes} alt={painting.title} className="h-[70vh] w-full object-contain" />

          {/* watermark overlay — simple, styled text centered */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg className="h-48 w-96 opacity-20" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice">
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="48" fill="#ffffff" transform="rotate(-25 300 100)">
                Melody DeBenedictis
              </text>
            </svg>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-2xl bg-surface/80 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="section-heading text-2xl font-semibold text-text">{painting.title}</h3>
              <p className="mt-1 text-sm text-text/70">{painting.dimensions} · {painting.medium}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="rounded-full bg-bg/20 px-3 py-2 text-sm text-text/80">Close</button>
            </div>
          </div>

          <div className="text-text/80">
            <p className="mb-2 text-sm">Year: {painting.year ?? '—'}</p>
            <p className="mb-2 text-sm">Status: {painting.status}</p>
            <p className="mb-2 text-sm">Tags: {painting.tags?.join(', ')}</p>
            <p className="mb-2 text-sm">{painting.description}</p>
          </div>

          <div className="mt-auto flex gap-3">
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover">Inquire</button>
            {painting.printsAvailable && (
              <button className="rounded-md border border-border bg-bg/30 px-4 py-2 text-sm text-text transition hover:border-accent">Buy Print</button>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-text/60">
            <button onClick={() => onNavigate((index - 1 + paintings.length) % paintings.length)}>← Prev</button>
            <span>{index + 1} / {paintings.length}</span>
            <button onClick={() => onNavigate((index + 1) % paintings.length)}>Next →</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
