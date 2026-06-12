import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GalleryGrid } from '../components/gallery/GalleryGrid';
import { apiFetch, normalizePaintings } from '../lib/api';
import type { Painting } from '../types';

export default function Home() {
  const [featured, setFeatured] = useState<Painting[]>([]);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [unsubState, setUnsubState] = useState<'idle' | 'submitting'>('idle');

  const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('newsletter_email') : null;
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(storedEmail);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubState('submitting');
    try {
      await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ name: subName || undefined, email: subEmail }),
      });
      localStorage.setItem('newsletter_email', subEmail);
      setSubscribedEmail(subEmail);
      setSubState('done');
    } catch {
      setSubState('error');
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribedEmail) return;
    setUnsubState('submitting');
    try {
      await apiFetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ email: subscribedEmail }),
      });
      localStorage.removeItem('newsletter_email');
      setSubscribedEmail(null);
      setSubState('idle');
      setSubEmail('');
      setSubName('');
    } catch (err) {
      console.error(err);
    } finally {
      setUnsubState('idle');
    }
  };

  useEffect(() => {
    apiFetch<unknown[]>('/api/paintings?featured=true')
      .then(normalizePaintings)
      .then(setFeatured)
      .catch(console.error);
    apiFetch<{ imageUrl: string }[]>('/api/paintings?search=Bays+and+Blues')
      .then((results) => { if (results[0]) setHeroImageUrl(results[0].imageUrl); })
      .catch(() => {}); // silently skip if not found
  }, []);
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_top,_rgba(196,132,58,0.16),transparent_35%),linear-gradient(180deg,#1a1612_0%,#0f0d0b_60%)] p-8 sm:p-12">
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            style={{
              zIndex: 0,
              filter: 'brightness(0.70) sepia(0.5) saturate(0.6)',
              maskImage: 'none',
              WebkitMaskImage: 'none',
              opacity: 0.9,
            }}
          />
        )}
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="section-heading text-4xl font-semibold leading-tight text-text sm:text-5xl">
                Painter of the West and Its Wild
              </h1>
              <p className="mt-3 text-2xl text-text/70">Bold color, quiet storytelling, deep atmosphere.</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-4">
              <Link to="/gallery" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover">
                View Gallery
              </Link>
              <Link to="/commission" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover">
                Commission a Painting
              </Link>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="overflow-hidden rounded-[2rem] border border-border shadow-soft">
              <img
                src="/melLanding.jpg"
                alt="Melody De Benedictis in her studio"
                className="w-full object-cover"
                style={{ maxHeight: '340px' }}
              />
              <div className="bg-[#181513]/90 px-6 py-4">
                <p className="text-sm text-text/70">Melody De Benedictis · Studio, Westcliffe CO</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-[#16120f]/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Stay connected</p>
              <h3 className="mt-4 text-2xl font-semibold text-text">Get occasional updates on new work, shows, and studio news.</h3>
              {subscribedEmail ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-accent">You're subscribed — thank you!</p>
                  <p className="text-xs text-text/50">{subscribedEmail}</p>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={unsubState === 'submitting'}
                    className="text-xs uppercase tracking-widest text-text/40 hover:text-text/70 transition disabled:opacity-50"
                  >
                    {unsubState === 'submitting' ? 'Unsubscribing…' : 'Unsubscribe'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-6 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="rounded-lg border border-border bg-bg/90 px-4 py-3 text-text outline-none transition focus:border-accent"
                  />
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="Your email"
                      required
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-bg/90 px-4 py-3 text-text outline-none transition focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={subState === 'submitting'}
                      className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-60"
                    >
                      {subState === 'submitting' ? '…' : 'Subscribe'}
                    </button>
                  </div>
                  {subState === 'error' && <p className="text-xs text-red-400">Something went wrong — please try again.</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="section-heading text-3xl font-semibold text-text">Featured Works</h2>
            <Link to="/gallery" className="text-sm uppercase tracking-[0.3em] text-text/70 transition hover:text-accent">See full gallery</Link>
          </div>
          <GalleryGrid paintings={featured} />
        </section>
      )}

    </div>
  );
}
