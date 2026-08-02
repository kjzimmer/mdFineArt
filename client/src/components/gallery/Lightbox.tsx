import { useEffect, useState } from 'react';
import type { Work } from '../../types';
import { useSiteConfig } from '../../context/SiteConfigContext';

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

export default function Lightbox({
  works,
  index,
  onClose,
  onNavigate,
  onInquire,
}: {
  works: Work[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  onInquire: (w: Work) => void;
}) {
  const { config } = useSiteConfig();
  const work = works[index];
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!work) return;
    const url = `${window.location.origin}/gallery/${work.slug}`;
    const linkText = `${work.title} — ${config.name}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: work.title, text: linkText, url });
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') console.error(err);
      }
      return;
    }
    try {
      const escaped = linkText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([url], { type: 'text/plain' }),
          'text/html': new Blob([`<a href="${url}">${escaped}</a>`], { type: 'text/html' }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % works.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + works.length) % works.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose, onNavigate, works.length]);

  useEffect(() => setCopied(false), [index]);

  if (!work) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 rounded-3xl bg-bg p-6 md:grid-cols-[60%_1fr]">
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-black">
          <img src={work.image} alt={work.title} className="h-[70vh] w-full object-contain" />
        </div>

        <aside className="flex flex-col gap-4 rounded-2xl bg-surface/80 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="section-heading text-2xl font-semibold text-text">{work.title}</h3>
              <p className="mt-1 text-sm text-text/70">{[work.dimensions, work.medium].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-full bg-bg/20 px-3 py-2 text-sm text-text/80 hover:bg-bg/40 transition"
                title="Share this work"
              >
                <ShareIcon />
                {copied ? '✓ Link copied' : 'Share'}
              </button>
              <button onClick={onClose} className="rounded-full bg-bg/20 px-3 py-2 text-sm text-text/80 hover:bg-bg/40 transition">
                Close
              </button>
            </div>
          </div>

          <div className="text-text/80 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">{work.year ?? '—'}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${work.status === 'Available' ? 'bg-success/10 text-success' : work.status === 'Sold' ? 'bg-sold/10 text-sold' : 'bg-text/10 text-text/60'}`}>
                {work.status === 'NFS' ? 'NFS' : work.status}
              </span>
              {work.printsAvailable && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Prints available
                </span>
              )}
            </div>
            <p className="text-sm">{work.description}</p>
            {config.showPrice && work.price != null && (
              <p className="text-sm font-semibold text-text">${work.price.toLocaleString()}</p>
            )}
            {work.tags && work.tags.length > 0 && (
              <p className="text-sm text-text/60">Tags: {work.tags.join(', ')}</p>
            )}
          </div>

          <div className="mt-auto">
            <button
              onClick={() => onInquire(work)}
              className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover"
            >
              Inquire about this work
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-text/60">
            <button onClick={() => onNavigate((index - 1 + works.length) % works.length)} className="hover:text-accent transition">← Prev</button>
            <span>{index + 1} / {works.length}</span>
            <button onClick={() => onNavigate((index + 1) % works.length)} className="hover:text-accent transition">Next →</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
