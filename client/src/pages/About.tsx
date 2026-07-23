import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { AboutShow, AboutAward, AboutMedia, AboutGallery, AboutMembership } from '../context/SiteConfigContext';

// Hardcoded fallbacks (used until admin configures About page content)

const FALLBACK_BIO = [
  "'Painter of the West and Its Wild' would be the best description of Melody DeBenedictis' work. Melody has been a full-time professional artist since 2014. Her fine art is focused on the land, the wild, and the wild mustang that call these lands home. Over the last 14 years Melody has traveled the western open lands extensively photographing and experiencing the wild that she incorporates in her paintings.",
  'A strong focus on the wild mustang and equine resonates with having her own wild and domestic horses and is easily seen in her work. She has spent these years showcasing her work in galleries across the west from Jackson Hole to Taos, attending art shows and festivals across the west, her fine art telling the stories of the wild and the wild mustang.',
  'She has won numerous awards over the years. Throughout her travels she has been in magazines, newspaper articles and radio. Melody has been called prolific in her career as an artist. Her work is a mix of realism and surrealism with a vivid color palette.',
];

const FALLBACK_STATEMENT = [
  "My art journey began early on as a child. Spending summers on my grandparents farm in southern Florida with a herd of horses and a variety of other animals only encouraged the creative aspirations within. If I wasn't out riding a horse, I would be indoors sketching or painting horses. By the time I reached my late teens I had a strong focus on art classes in high school and had a watercolor painting and pencil drawing awarded to the 'Smithsonian Museum' and attended 'Crealde Art Institute' from a scholarship offered in my senior year of high school. Though I took a photography class rather than a painting class, this helped me to understand the importance of capturing 'light', this translates in my work even today.",
  "During my late teens and early twenties, I spent most of my summers attending art shows throughout Florida, including the highly recognized 'Winter Park' Art show. During my early twenties I got involved in Interior Design and didn't create art for years. It would be in my late forties before I had the desire to begin creating again.",
  'Turning 50, I moved west to Colorado from the east with intentions of getting back to my creative roots. I have been a full time artist since 2014. A self-taught artist with no formal training since graduating high school. I constantly challenge myself and study building my artistic skills and develop the style that I have reached to date. With a blend of realism and surrealism how I approach each unique piece. I have been called prolific in my work and am known for the intense color palette and emotion conveyed in each piece. The impact the west during my first \'wild horse range\' trip in NW Colorado has kept my passion fueled. Little did I know the impact that first trip would make on my journey of creating art.',
  "The paintings I create in oil inspired by the land, the wild, and the wild mustang that call these western lands home. I would call myself a 'purist' in my artistic approach as I do not use projector or grids, rather continue to develop eye to hand to canvas skill. The theme and color palette of my work is vivid, bringing the experiences I have encountered alive to retell their story on canvas. I have spent the last 14 years traveling across the western states on rugged open range photographing and exploring the wild of our west. My story has been told in newspaper articles, magazines, and radio over the years, and continues to be told today with each new range trip traversing across rugged landscapes, and spending studio time recreating those cherished experiences.",
];

const FALLBACK_SHOWS: AboutShow[] = [
  { year: 2011, name: 'Mustang Makeover', location: 'Fort Collins, CO' },
  { year: 2011, name: 'Extreme Mustang Makeover', location: 'Fort Worth, TX' },
  { year: 2011, name: 'Cherry Blossom Gallery Show', location: 'CO' },
  { year: 2012, name: 'Spirit of the Wild Horse Show', location: 'Santa Fe, NM' },
  { year: 2012, name: 'Mustang Makeover', location: 'WY' },
  { year: 2012, name: 'Lovell Mustang Days', location: 'WY' },
  { year: 2012, name: 'Territorial Days', location: 'NM' },
  { year: 2012, name: "Stables Gallery 'Horses' Show", location: 'Taos, NM' },
  { year: 2013, name: 'Wild Horse Art Show', location: 'Maybell & Craig, CO' },
  { year: 2014, name: 'Las Vegas NM Studio Tour', location: 'NM' },
  { year: 2015, name: 'Thundering Hooves', location: 'Beverly Hills, CA' },
  { year: 2015, name: 'Thundering Hooves', location: 'TX' },
  { year: 2016, name: 'Thundering Hooves', location: 'Marfa, TX' },
  { year: 2016, name: 'Thundering Hooves', location: 'Santa Fe, NM' },
  { year: 2016, name: 'Celebrating the Horse Show', location: 'Santa Fe, NM' },
  { year: 2016, name: 'Las Vegas Arts Council Studio Tour', location: 'NM' },
  { year: 2018, name: 'Angel Fire Studio Tour', location: 'NM' },
  { year: 2019, name: 'Thundering Hooves', location: 'Fort Davis, TX' },
  { year: 2019, name: 'Equus Film and Art Fest', location: 'Sedona, AZ' },
  { year: 2019, name: 'Wild Mustang Show', location: 'Livermore, CO' },
  { year: 2023, name: 'Rocky Mountain Horse Expo', location: 'Denver, CO' },
  { year: 2023, name: 'Cowgirl Gathering', location: 'Fort Worth Stockyards' },
];

const FALLBACK_AWARDS: AboutAward[] = [
  { year: 2018, award: 'Second Place Award', event: 'Angel Fire Art UP', location: 'NM' },
  { year: 2020, award: 'First Place', event: 'Sangre Art Guild', location: 'Westcliffe' },
  { year: 2020, award: 'Winner', event: 'Equus Film and Art Fest', location: '' },
  { year: 2021, award: 'Winnie Winner', event: 'Equus Film and Art Fest', location: '' },
  { year: 2022, award: 'Special Award', event: 'Sangre Art Guild', location: 'Westcliffe' },
  { year: 2022, award: "People's Choice Award", event: 'Sangre Art Guild', location: 'Westcliffe' },
  { year: 2022, award: 'First Place Award (×2)', event: 'Sangre Art Guild', location: 'Westcliffe' },
  { year: 2022, award: 'Second Place Award', event: 'Sangre Art Guild', location: 'Westcliffe' },
  { year: 2022, award: 'Winnie Winner', event: 'Equus Film Festival', location: '' },
  { year: 2023, award: 'Second Place Award', event: 'Mustang Summit, Equus Film and Art Fest', location: '' },
  { year: 2024, award: 'Artist Recognition Award', event: '365 Art&Color Exhibition', location: '' },
  { year: 2025, award: 'Honorable Mention', event: '365 Art&Color Magazine Exhibition', location: '' },
];

const FALLBACK_MEDIA: AboutMedia[] = [
  { year: 2014, title: '"Horses in Art" Magazine' },
  { year: 2014, title: '"Cowgirl Magazine"' },
  { year: 2016, title: '"Their Last Ride" Documentary Film' },
  { year: 2024, title: '"Equustyle Magazine" Summer Publication' },
  { year: 2025, title: 'Juror — Equine Style, Art&Color365 Competition' },
];

const FALLBACK_GALLERIES: AboutGallery[] = [
  { year: 2012, name: 'Grand Teton Gallery', location: 'Jackson Hole, WY' },
  { year: 2012, name: 'Creative Spirits Gallery', location: 'Fort Collins, CO' },
  { year: 2014, name: 'Thomas Gallery', location: 'Taos, NM' },
  { year: 2016, name: 'Running Horses Studio', location: 'Las Vegas, NM' },
  { year: 2023, name: 'Melody De Benedictis Fine Art Gallery', location: 'Westcliffe, CO' },
];

const FALLBACK_MEMBERSHIPS: AboutMembership[] = [
  { name: 'Cowgirl Artists of America', level: 'PRO Member', logoUrl: '/logos/caa.jpg' },
  { name: 'Women Artists of the West', level: 'Associate Member', logoUrl: '/logos/WAOW_Logo-Chrome+on+Blk.jpg' },
  { name: 'Sangres Art Guild', level: 'Member · Westcliffe, CO', logoUrl: '/logos/SangresArtGuild_Logo_RGB_OrangeRed_300dpi_cropped.png' },
];

const FALLBACK_BIO_SUBTITLE = '';
const FALLBACK_STAT_SUBTITLE = 'The Art, Music and Songwriting…';
const FALLBACK_PROFILE_IMAGE = '/melOnBelle.jpg';
const FALLBACK_STAT_IMAGE = '/melInAction.jpg';
const FALLBACK_STUDIO_IMAGE = '/studio.jpg';


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

  // Resolve config vs. fallbacks
  const bio = config.aboutBio.length > 0 ? config.aboutBio : FALLBACK_BIO;
  const bioSubtitle = config.aboutBioSubtitle || FALLBACK_BIO_SUBTITLE;
  const statement = config.aboutStatement.length > 0 ? config.aboutStatement : FALLBACK_STATEMENT;
  const statSubtitle = config.aboutStatSubtitle || FALLBACK_STAT_SUBTITLE;
  const shows = config.aboutShows.length > 0 ? config.aboutShows : FALLBACK_SHOWS;
  const awards = config.aboutAwards.length > 0 ? config.aboutAwards : FALLBACK_AWARDS;
  const media = config.aboutMedia.length > 0 ? config.aboutMedia : FALLBACK_MEDIA;
  const galleries = config.aboutGalleries.length > 0 ? config.aboutGalleries : FALLBACK_GALLERIES;
  const memberships = config.aboutMemberships.length > 0 ? config.aboutMemberships : FALLBACK_MEMBERSHIPS;
  const profileImage = config.profileImageUrl || FALLBACK_PROFILE_IMAGE;
  const statImage = config.aboutStatImage1Url || FALLBACK_STAT_IMAGE;
  const studioImage = config.studioImageUrl || FALLBACK_STUDIO_IMAGE;
  const studioLocation = config.studioLocation || 'Westcliffe, Colorado';
  const contactHeading = config.contactHeading || 'Have a question or just want to say hello?';
  const contactBody = config.contactBody.length > 0 ? config.contactBody : [
    `${config.aboutName || 'Melody'} works from ${studioLocation === 'Westcliffe, Colorado' ? 'her studio in Westcliffe, Colorado' : `a studio in ${studioLocation}`} and will follow up directly by email or phone.`,
  ];
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
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6 text-text/80 leading-relaxed">
            {bio.map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem]">
            <img
              src={profileImage}
              alt={config.aboutName || 'Artist portrait'}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,13,11,0.75) 0%, transparent 45%)' }} />
          </div>
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
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6 text-text/80 leading-relaxed">
            {statement.map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem]">
            <img src={statImage} alt="Artist at work" className="absolute inset-0 h-full w-full object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,13,11,0.75) 0%, transparent 45%)' }} />
          </div>
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
            <div className="relative overflow-hidden rounded-[1.5rem]" style={{ minHeight: '180px' }}>
              <img src={studioImage} alt={contactImageCaption} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0.2) 50%, transparent 100%)' }} />
              {contactImageCaption && (
                <div className="absolute bottom-0 left-0 right-0 px-6 py-5">
                  <p className="text-sm text-text">{contactImageCaption}</p>
                </div>
              )}
            </div>
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
