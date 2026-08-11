import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GalleryGrid } from '../components/gallery/GalleryGrid';
import { HeroSlideshow } from '../components/HeroSlideshow';
import MediaLightbox from '../components/shared/MediaLightbox';
import { apiFetch, normalizeWorks } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { DigitalAsset, Work } from '../types';

interface FeaturedInProgress {
  work: { id: string; title: string | null; slug: string; imageUrl: string | null; description: string | null };
  photos: DigitalAsset[];
}

export default function Home() {
  const { config } = useSiteConfig();
  const [featured, setFeatured] = useState<Work[]>([]);
  const [inProgressList, setInProgressList] = useState<FeaturedInProgress[]>([]);
  const [lightbox, setLightbox] = useState<{ workIndex: number; photoIndex: number } | null>(null);
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
    if (config.featuredEnabled) {
      apiFetch<unknown[]>('/api/works?featured=true')
        .then(normalizeWorks)
        .then(setFeatured)
        .catch(console.error);
    }
  }, [config.featuredEnabled]);

  useEffect(() => {
    if (config.worksInProgressEnabled) {
      apiFetch<FeaturedInProgress[]>('/api/works/in-progress')
        .then(setInProgressList)
        .catch(console.error);
    }
  }, [config.worksInProgressEnabled]);

  // Progress photos first, then the completed/current image (if the artist has uploaded
  // one) as the last frame — browsing feels like "here's the journey, here's the result."
  const lightboxImagesFor = (item: FeaturedInProgress) => [
    ...item.photos.map((p) => ({ url: p.imageUrl, caption: p.caption })),
    ...(item.work.imageUrl ? [{ url: item.work.imageUrl, caption: 'Current state' }] : []),
  ];

  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden hero-section-bg rounded-section border border-border p-8 sm:p-12">
        {config.heroImageUrl && (
          <img
            src={config.heroImageUrl}
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
                {config.taglinePrimary}
              </h1>
              <p className="mt-3 text-2xl text-text/70">{config.taglineSecondary}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-4">
              <Link to="/gallery" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover">
                View Gallery
              </Link>
              {config.commissionsEnabled && (
                <Link to="/commission" className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover">
                  Commission a Painting
                </Link>
              )}
            </div>
          </div>
          <div className="grid gap-6">
            <HeroSlideshow />
            {config.newsletterEnabled && <div className="rounded-hero border border-border bg-surface-overlay/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">{config.newsletterTitle}</p>
              <h3 className="mt-4 text-2xl font-semibold text-text">{config.newsletterTagline}</h3>
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
            </div>}
          </div>
        </div>
      </section>

      {config.featuredEnabled && featured.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="section-heading text-3xl font-semibold text-text">Featured Works</h2>
            <Link to="/gallery" className="text-sm uppercase tracking-[0.3em] text-text/70 transition hover:text-accent">See full gallery</Link>
          </div>
          <GalleryGrid works={featured.slice(0, config.featuredCount)} />
        </section>
      )}

      {config.worksInProgressEnabled && inProgressList.length > 0 && (
        <section className="space-y-12">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent/90">In the studio</p>
            <h2 className="section-heading mt-3 text-3xl font-semibold text-text">Works in Progress</h2>
          </div>
          {inProgressList.map((item, workIndex) => (
            <div key={item.work.id} className="space-y-4">
              {item.work.title && <h3 className="text-xl font-semibold text-text">{item.work.title}</h3>}
              <div className={`grid gap-6 ${item.work.imageUrl && item.photos.length > 0 ? 'sm:grid-cols-5' : ''}`}>
                {item.work.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setLightbox({ workIndex, photoIndex: lightboxImagesFor(item).length - 1 })}
                    className={`flex items-center justify-center overflow-hidden rounded-hero border border-border bg-surface shadow-soft ${item.photos.length > 0 ? 'sm:col-span-3' : ''}`}
                    style={{ height: 440 }}
                  >
                    {/* Fixed-height box, object-contain (not cover) — normalizes every
                        work's card to the same footprint regardless of the source image's
                        native aspect ratio, while still showing the whole image uncropped
                        (letterboxed on whichever axis doesn't fill the box). */}
                    <img src={item.work.imageUrl} alt="Current state" className="h-full w-full object-contain" />
                  </button>
                )}
                {item.photos.length > 0 && (
                  <div className={`space-y-3 ${item.work.imageUrl ? 'sm:col-span-2' : ''}`}>
                    <div className="min-h-[2.5rem]">
                      <p className="text-xs uppercase tracking-[0.25em] text-accent/70">Progress</p>
                      {item.work.description && <p className="mt-1 text-sm text-text/70">{item.work.description}</p>}
                    </div>
                    {/* Individual photos, not a slideshow — Melody wants each progress shot
                        visible at a glance, not merged into one rotating frame. Each opens
                        the full-screen viewer at its own position. */}
                    <div className="grid grid-cols-3 gap-2">
                      {item.photos.map((photo, photoIndex) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setLightbox({ workIndex, photoIndex })}
                          className="aspect-square overflow-hidden rounded-lg border border-border transition hover:border-accent"
                        >
                          <img src={photo.thumbUrl} alt={photo.caption ?? ''} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {lightbox && (
        <MediaLightbox
          images={lightboxImagesFor(inProgressList[lightbox.workIndex])}
          index={lightbox.photoIndex}
          onClose={() => setLightbox(null)}
          onNavigate={(photoIndex) => setLightbox({ workIndex: lightbox.workIndex, photoIndex })}
        />
      )}
    </div>
  );
}

