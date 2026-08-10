import { useEffect, useRef, useState } from 'react';

export interface MediaLightboxImage {
  url: string;
  caption?: string | null;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

// Generic full-screen image viewer — no Work-specific metadata, price, status, or CTA.
// Supports zoom/pan (mouse wheel, drag, pinch) so reference/progress photos can be
// inspected up close, e.g. while painting from a reference, plus a true browser-fullscreen
// toggle (Fullscreen API) so reference viewing can use the entire screen. Used by the
// Reference Library browse grid, the work editor's progress/reference photo sections, and
// the Home page's Works in Progress section. The public gallery's Lightbox.tsx is tightly
// coupled to the Work domain type and stays untouched — this is a separate component.
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragState = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pinchState = useRef<{ distance: number; scale: number } | null>(null);

  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  useEffect(() => { reset(); }, [index]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      wrapperRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };

  const clampOffset = (next: { x: number; y: number }, nextScale: number) => {
    const el = containerRef.current;
    if (!el || nextScale <= 1) return { x: 0, y: 0 };
    // Rough bound: don't let the image pan further than half the extra (scaled) size —
    // good enough for a lightbox, doesn't need to be pixel-perfect against natural size.
    const maxX = (el.clientWidth * (nextScale - 1)) / 2;
    const maxY = (el.clientHeight * (nextScale - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  };

  const zoomAt = (clientX: number, clientY: number, delta: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pointX = clientX - rect.left - rect.width / 2;
    const pointY = clientY - rect.top - rect.height / 2;
    setScale((prevScale) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale + delta));
      setOffset((prevOffset) => {
        // Keep the point under the cursor stationary while zooming.
        const ratio = nextScale / prevScale;
        const next = {
          x: pointX - (pointX - prevOffset.x) * ratio,
          y: pointY - (pointY - prevOffset.y) * ratio,
        };
        return clampOffset(next, nextScale);
      });
      return nextScale;
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? -0.35 : 0.35);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) reset();
    else zoomAt(e.clientX, e.clientY, 1.5);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragState.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    setOffset(clampOffset({ x: dragState.current.offsetX + dx, y: dragState.current.offsetY + dy }, scale));
  };
  const endDrag = () => { dragState.current = null; };

  const touchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchState.current = { distance: touchDistance(e.touches), scale };
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      dragState.current = { x: t.clientX, y: t.clientY, offsetX: offset.x, offsetY: offset.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const nextDistance = touchDistance(e.touches);
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchState.current.scale * (nextDistance / pinchState.current.distance)));
      setScale(nextScale);
      setOffset((prev) => clampOffset(prev, nextScale));
    } else if (e.touches.length === 1 && dragState.current) {
      const t = e.touches[0];
      const dx = t.clientX - dragState.current.x;
      const dy = t.clientY - dragState.current.y;
      setOffset(clampOffset({ x: dragState.current.offsetX + dx, y: dragState.current.offsetY + dy }, scale));
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchState.current = null;
    if (e.touches.length < 1) dragState.current = null;
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
      if (scale > 1) return; // arrow keys pan-free while zoomed; nav only at 1x
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, onClose, onNavigate, images.length, scale]);

  if (!image) return null;

  return (
    <div ref={wrapperRef} className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="rounded-full bg-bg/20 px-3 py-2 text-sm text-text/80 hover:bg-bg/40 transition"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
        <button
          onClick={handleClose}
          className="rounded-full bg-bg/20 px-3 py-2 text-sm text-text/80 hover:bg-bg/40 transition"
        >
          Close
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: scale > 1 ? 'grab' : 'default', touchAction: 'none' }}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={image.url}
          alt={image.caption || ''}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragState.current || pinchState.current ? 'none' : 'transform 0.15s ease-out',
          }}
        />
        {scale > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition"
          >
            Reset zoom
          </button>
        )}
      </div>

      {(image.caption || images.length > 1) && (
        <div className="flex items-center justify-between gap-6 bg-black/90 px-6 py-3 text-sm text-text/60">
          {images.length > 1 ? (
            <button onClick={() => onNavigate((index - 1 + images.length) % images.length)} className="hover:text-accent transition">← Prev</button>
          ) : <span />}
          <span className="text-center">
            {image.caption && <span className="text-text/80">{image.caption}</span>}
            {images.length > 1 && <span className="ml-3 text-text/40">{index + 1} / {images.length}</span>}
            <span className="ml-3 hidden text-text/30 sm:inline">· scroll or pinch to zoom, drag to pan</span>
          </span>
          {images.length > 1 ? (
            <button onClick={() => onNavigate((index + 1) % images.length)} className="hover:text-accent transition">Next →</button>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
