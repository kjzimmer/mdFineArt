import { useEffect, useState } from 'react';

interface Slide {
  id: string;
  imageUrl: string;
  caption: string | null;
}

const INTERVAL_MS = 5000;

export function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch('/api/slides/landing')
      .then((r) => r.ok ? r.json() : [])
      .then((data: Slide[]) => setSlides(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-hero border border-border shadow-soft">
      <div className="relative" style={{ height: '340px' }}>
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
      <div className="relative bg-surface-overlay/90 px-6 py-4" style={{ height: '44px' }}>
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
    </div>
  );
}
