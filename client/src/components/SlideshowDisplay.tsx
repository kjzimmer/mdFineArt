import { useEffect, useState } from 'react';

interface Slide {
  id: string;
  imageUrl: string;
  caption: string | null;
}

interface Props {
  slides: Slide[];
  height?: number;
}

const INTERVAL_MS = 5000;

export function SlideshowDisplay({ slides, height = 320 }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [slides]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const hasCaption = slides.some((s) => s.caption);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border shadow-soft">
      <div className="relative" style={{ height: `${height}px` }}>
        {slides.map((slide, i) => (
          <img
            key={slide.id}
            src={slide.imageUrl}
            alt={slide.caption ?? ''}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: i === current ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}
          />
        ))}
        {slides.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center gap-1.5 pb-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-4 bg-accent' : 'w-1.5 bg-text/30 hover:bg-text/60'}`}
              />
            ))}
          </div>
        )}
      </div>
      {hasCaption && (
        <div className="relative bg-[#181513]/90" style={{ height: '44px' }}>
          {slides.map((slide, i) => (
            <p
              key={slide.id}
              className="absolute inset-0 flex items-center px-6 text-sm text-text/70"
              style={{ opacity: i === current ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}
            >
              {slide.caption}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
