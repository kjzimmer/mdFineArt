import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GalleryGrid } from '../components/gallery/GalleryGrid';
import { apiFetch, normalizePaintings } from '../lib/api';
import type { Painting } from '../types';

export default function Home() {
  const [featured, setFeatured] = useState<Painting[]>([]);
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubState('submitting');
    try {
      await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ name: subName || undefined, email: subEmail }),
      });
      setSubState('done');
    } catch {
      setSubState('error');
    }
  };

  useEffect(() => {
    apiFetch<unknown[]>('/api/paintings?featured=true')
      .then(normalizePaintings)
      .then(setFeatured)
      .catch(console.error);
  }, []);
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top,_rgba(196,132,58,0.16),transparent_35%),linear-gradient(180deg,#1a1612_0%,#0f0d0b_60%)] p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="space-y-8">
            <span className="text-sm uppercase tracking-[0.4em] text-accent/90">Western oil paintings</span>
            <h1 className="section-heading max-w-3xl text-5xl font-semibold leading-tight text-text sm:text-6xl">
              Painter of the West and Its Wild — bold color, quiet storytelling, deep atmosphere.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-text/80">
              Original paintings, limited prints, and custom commissions from a Colorado studio rooted in western heritage and natural light.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/gallery" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover">
                View Gallery
              </Link>
              <Link to="/commission" className="inline-flex items-center justify-center rounded-md border border-text/20 bg-white/5 px-6 py-3 text-sm font-semibold text-text transition hover:border-accentHover">
                Commission a Painting
              </Link>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-border bg-[#181513]/90 p-6 shadow-soft">
              <h2 className="section-heading text-3xl font-semibold text-text">Current Studio Focus</h2>
              <p className="mt-4 text-text/75">Exploring western light, solitary horses, expansive landscapes, and large-scale oil studies for collectors and galleries.</p>
              <div className="mt-6 space-y-5 text-sm text-text/80">
                <p><span className="font-semibold text-text">Studio:</span> Westcliffe, CO — by appointment</p>
                <p><span className="font-semibold text-text">Memberships:</span> CGA Pro Member, WAOW Associate Member</p>
                <p><span className="font-semibold text-text">New work:</span> Original paintings and select archival prints.</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-[#16120f]/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Stay connected</p>
              <h3 className="mt-4 text-2xl font-semibold text-text">Get occasional updates on new work, shows, and studio news.</h3>
              {subState === 'done' ? (
                <p className="mt-6 text-sm text-accent">You're on the list — thank you!</p>
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
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Featured Works</p>
              <h2 className="section-heading mt-3 text-3xl font-semibold text-text">A glimpse of current paintings.</h2>
            </div>
            <Link to="/gallery" className="text-sm uppercase tracking-[0.3em] text-text/70 transition hover:text-text">See full gallery</Link>
          </div>
          <GalleryGrid paintings={featured} />
        </section>
      )}

    </div>
  );
}
