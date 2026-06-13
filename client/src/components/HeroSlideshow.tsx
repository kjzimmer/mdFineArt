import { useEffect, useState } from 'react';

const slides = [
  { src: '/melLanding.jpg', caption: 'Melody De Benedictis · Studio, Westcliffe CO' },
  { src: '/studio.jpg', caption: 'The studio · Westcliffe CO' },
  { src: '/melInAction.jpg', caption: 'At work on a new painting' },
  { src: '/melOnBelle.jpg', caption: 'With Belle' },
  { src: '/melSnowCat.jpg', caption: 'Out in the field' },
];

const INTERVAL_MS = 5000;

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, 400);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border shadow-soft">
      <div className="relative" style={{ height: '340px' }}>
        <img
          key={current}
          src={slide.src}
          alt={slide.caption}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.4s ease-in-out',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 flex gap-1.5 justify-center pb-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-4 bg-accent' : 'w-1.5 bg-text/30 hover:bg-text/60'}`}
            />
          ))}
        </div>
      </div>
      <div className="bg-[#181513]/90 px-6 py-4">
        <p
          className="text-sm text-text/70 transition-opacity duration-400"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease-in-out' }}
        >
          {slide.caption}
        </p>
      </div>
    </div>
  );
}
