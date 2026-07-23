import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { AboutMembership } from '../context/SiteConfigContext';



type ContactStatus = 'idle' | 'loading' | 'success' | 'error';

export default function About() {
  const { config } = useSiteConfig();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<ContactStatus>('idle');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify(form) });
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const bio = config.aboutBio;
  const bioSubtitle = config.aboutBioSubtitle;
  const statement = config.aboutStatement;
  const statSubtitle = config.aboutStatSubtitle;
  const shows = config.aboutShows;
  const awards = config.aboutAwards;
  const media = config.aboutMedia;
  const galleries = config.aboutGalleries;
  const memberships: AboutMembership[] = config.aboutMemberships;
  const profileImage = config.profileImageUrl;
  const statImage = config.aboutStatImage1Url;
  const studioImage = config.studioImageUrl;
  const studioLocation = config.studioLocation;
  const contactHeading = config.contactHeading || 'Have a question or just want to say hello?';
  const contactBody = config.contactBody;
  const contactImageCaption = config.contactImageCaption || studioLocation;

  return (
    <div className="space-y-12">

      {/* Bio */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <h1 className="section-heading text-4xl font-semibold text-text">Artist Bio</h1>
        {(config.aboutName || bioSubtitle) && (
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-accent/80">
            {[config.aboutName, bioSubtitle].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className={`mt-8 grid gap-10 ${profileImage ? 'lg:grid-cols-[1fr_1fr]' : ''}`}>
          <div className="space-y-6 text-text/80 leading-relaxed">
            {bio.map((para, i) => <p key={i}>{para}</p>)}
          </div>
          {profileImage && (
            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem]">
              <img
                src={profileImage}
                alt={config.aboutName || 'Artist portrait'}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,13,11,0.75) 0%, transparent 45%)' }} />
            </div>
          )}
        </div>
        {memberships.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm font-semibold text-text mb-4">Professional Memberships</p>
            <div className="flex items-center gap-4 flex-wrap">
              {memberships.map((m, i) => {
                const inner = m.logoUrl ? (
                  <div title={m.name} className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                    <img src={m.logoUrl} alt={m.name} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-xs font-semibold text-text/80">{m.name}</p>
                    <p className="text-xs text-text/50">{m.level}</p>
                  </div>
                );
                return m.url ? (
                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="transition opacity-80 hover:opacity-100">
                    {inner}
                  </a>
                ) : (
                  <div key={i} className="cursor-default">{inner}</div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Artist Statement */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <h2 className="section-heading text-3xl font-semibold text-text">Artist Statement</h2>
        {statSubtitle && (
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-accent/80">{statSubtitle}</p>
        )}
        <div className={`mt-8 grid gap-10 ${statImage ? 'lg:grid-cols-[1fr_1fr]' : ''}`}>
          <div className="space-y-6 text-text/80 leading-relaxed">
            {statement.map((para, i) => <p key={i}>{para}</p>)}
          </div>
          {statImage && (
            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem]">
              <img src={statImage} alt="Artist at work" className="absolute inset-0 h-full w-full object-cover object-top" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,13,11,0.75) 0%, transparent 45%)' }} />
            </div>
          )}
        </div>
      </section>

      {/* Exhibitions */}
      {shows.length > 0 && (
        <section className="rounded-[2rem] border border-border bg-surface/80 p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Shows &amp; Exhibitions</p>
          <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Selected exhibitions</h2>
          <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {shows.map((e, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm text-text/80">
                <span className="shrink-0 tabular-nums text-accent/70">{e.year}</span>
                <span>{e.name}<span className="text-text/50"> · {e.location}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Awards + Media */}
      <section className="grid gap-8 lg:grid-cols-2">
        {awards.length > 0 && (
          <div className="rounded-[2rem] border border-border bg-surface/80 p-8 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Recognition</p>
            <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Awards</h2>
            <ul className="mt-6 space-y-3">
              {awards.map((a, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm text-text/80">
                  <span className="shrink-0 tabular-nums text-accent/70">{a.year}</span>
                  <span>
                    <span className="font-medium text-text">{a.award}</span>
                    <span className="text-text/50"> · {a.event}{a.location ? `, ${a.location}` : ''}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-8">
          {media.length > 0 && (
            <div className="rounded-[2rem] border border-border bg-surface/80 p-8 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Press</p>
              <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Media</h2>
              <ul className="mt-6 space-y-3">
                {media.map((m, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-sm text-text/80">
                    <span className="shrink-0 tabular-nums text-accent/70">{m.year}</span>
                    <span>{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {galleries.length > 0 && (
            <div className="rounded-[2rem] border border-border bg-[#181513]/90 p-8 shadow-soft">
              <p className="text-xs uppercase tracking-[0.3em] text-accent/90">History</p>
              <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Past gallery representation</h2>
              <ul className="mt-6 space-y-3">
                {galleries.map((g, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-sm text-text/80">
                    <span className="shrink-0 tabular-nums text-accent/70">{g.year}</span>
                    <span>{g.name}<span className="text-text/50"> · {g.location}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* General contact */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Get in touch</p>
        <h2 className="section-heading mt-4 text-3xl font-semibold text-text">{contactHeading}</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 text-text/70">
            {contactBody.map((para, i) => <p key={i}>{para}</p>)}
            {studioImage && (
              <div className="relative overflow-hidden rounded-[1.5rem]" style={{ minHeight: '180px' }}>
                <img src={studioImage} alt={contactImageCaption || ''} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0.2) 50%, transparent 100%)' }} />
                {contactImageCaption && (
                  <div className="absolute bottom-0 left-0 right-0 px-6 py-5">
                    <p className="text-sm text-text">{contactImageCaption}</p>
                  </div>
                )}
              </div>
            )}
            {config.contactEmail && (
              <p className="text-sm">
                <a href={`mailto:${config.contactEmail}`} className="text-accent hover:text-accentHover transition">
                  {config.contactEmail}
                </a>
              </p>
            )}
            {config.contactPhone && (
              <p className="text-sm">{config.contactPhone}</p>
            )}
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-bg/90 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Message sent</p>
              <h3 className="section-heading mt-4 text-2xl font-semibold text-text">Thank you!</h3>
              <p className="mt-4 text-text/70">{config.aboutName || 'Melody'} will be in touch soon.</p>
              <button onClick={() => setStatus('idle')} className="mt-6 text-sm uppercase tracking-[0.2em] text-accent transition hover:text-accentHover">
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-border bg-bg/90 p-8">
              <input value={form.name} onChange={set('name')} required placeholder="Name"
                className="w-full rounded-3xl border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent" />
              <input type="email" value={form.email} onChange={set('email')} required placeholder="Email"
                className="w-full rounded-3xl border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent" />
              <input value={form.subject} onChange={set('subject')} required placeholder="Subject"
                className="w-full rounded-3xl border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent" />
              <textarea rows={5} value={form.message} onChange={set('message')} required placeholder="Message"
                className="w-full rounded-[2rem] border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent" />
              {status === 'error' && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}
              <button type="submit" disabled={status === 'loading'}
                className="rounded-3xl bg-accent px-6 py-4 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50">
                {status === 'loading' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
