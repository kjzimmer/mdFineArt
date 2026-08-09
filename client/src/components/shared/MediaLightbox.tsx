import { useEffect } from 'react';

export interface MediaLightboxImage {
  url: string;
  caption?: string | null;
}

// Generic full-screen image viewer — no Work-specific metadata, price, status, or CTA.
// Used by the Reference Library browse grid, the work editor's progress/reference photo
// sections, and the public Works in Progress page. The public gallery's Lightbox.tsx is
// tightly coupled to the Work domain type and stays untouched — this is a separate component.
export default function MediaLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: MediaLightboxImage[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const image = images[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose, onNavigate, images.length]);

  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full bg-bg/20 px-3 py-2 text-sm text-text/80 hover:bg-bg/40 transition"
      >
        Close
      </button>

      <div className="flex max-h-[85vh] max-w-5xl flex-col items-center gap-3">
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-black">
          <img src={image.url} alt={image.caption || ''} className="max-h-[75vh] w-full object-contain" />
        </div>
        {image.caption && <p className="text-sm text-text/70">{image.caption}</p>}

        {images.length > 1 && (
          <div className="flex items-center justify-between gap-6 text-sm text-text/60">
            <button onClick={() => onNavigate((index - 1 + images.length) % images.length)} className="hover:text-accent transition">← Prev</button>
            <span>{index + 1} / {images.length}</span>
            <button onClick={() => onNavigate((index + 1) % images.length)} className="hover:text-accent transition">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
