import { useEffect, useState } from 'react';

interface GalleryEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  venue: string;
  description: string | null;
  externalLink: string | null;
  imageUrl: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function Events() {
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      <section className="rounded-section border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Events</p>
        <h1 className="section-heading mt-4 text-4xl font-semibold text-text">Upcoming &amp; Recent</h1>
      </section>

      {loading && <p className="text-text/60">Loading…</p>}

      {!loading && events.length === 0 && (
        <div className="rounded-section border border-border bg-surface/60 py-20 text-center">
          <p className="text-text/50">No events scheduled at this time. Check back soon.</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-4">
          {events.map((ev) => (
            <article key={ev.id} className="rounded-hero border border-border bg-surface/80 p-8 shadow-soft">
              <div className={ev.imageUrl ? 'grid gap-8 lg:grid-cols-[1fr_280px] items-start' : ''}>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-accent/80">
                    {formatDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}
                  </p>
                  <h2 className="section-heading text-2xl font-semibold text-text">{ev.title}</h2>
                  <p className="text-sm text-text/60">{ev.venue}</p>
                  {ev.description && (
                    <p className="text-text/75 leading-8 pt-1">{ev.description}</p>
                  )}
                  {ev.externalLink && (
                    <a
                      href={ev.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 rounded-md border border-accent px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-bg"
                    >
                      More info →
                    </a>
                  )}
                </div>
                {ev.imageUrl && (
                  <img
                    src={ev.imageUrl}
                    alt={ev.title}
                    className="w-full rounded-lg object-cover aspect-[4/3]"
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
