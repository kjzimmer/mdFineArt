import { useEffect, useState } from 'react';

interface Testimonial {
  id: string;
  authorName: string;
  authorDetail: string | null;
  quote: string;
  photoUrl: string | null;
}

interface Props {
  context: string;
}

export function TestimonialsSection({ context }: Props) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch(`/api/testimonials/${context}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Testimonial[]) => setTestimonials(data))
      .catch(() => {});
  }, [context]);

  if (testimonials.length === 0) return null;

  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="text-xs uppercase tracking-[0.3em] text-accent/80">What people are saying</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {testimonials.map((t) => (
          <div key={t.id} className="rounded-hero border border-border bg-surface/80 p-6 shadow-soft">
            <p className="text-text/80 leading-7">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              {t.photoUrl && (
                <img src={t.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <p className="text-sm font-semibold text-text">{t.authorName}</p>
                {t.authorDetail && <p className="text-xs text-text/50">{t.authorDetail}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
