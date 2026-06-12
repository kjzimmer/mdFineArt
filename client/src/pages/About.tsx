import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const exhibitions = [
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

const awards = [
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

const media = [
  { year: 2014, title: '"Horses in Art" Magazine' },
  { year: 2014, title: '"Cowgirl Magazine"' },
  { year: 2016, title: '"Their Last Ride" Documentary Film' },
  { year: 2024, title: '"Equustyle Magazine" Summer Publication' },
  { year: 2025, title: 'Juror — Equine Style, Art&Color365 Competition' },
];

const galleries = [
  { year: 2012, name: 'Grand Teton Gallery', location: 'Jackson Hole, WY' },
  { year: 2012, name: 'Creative Spirits Gallery', location: 'Fort Collins, CO' },
  { year: 2014, name: 'Thomas Gallery', location: 'Taos, NM' },
  { year: 2016, name: 'Running Horses Studio', location: 'Las Vegas, NM' },
  { year: 2023, name: 'Melody De Benedictis Fine Art Gallery', location: 'Westcliffe, CO' },
];

const memberships = [
  { abbr: 'CAA', full: 'Cowgirl Artists of America', level: 'PRO Member', logo: '/logos/caa.jpg' },
  { abbr: 'WAOW', full: 'Women Artists of the West', level: 'Associate Member', logo: '/logos/WAOW_Logo-Chrome+on+Blk.jpg' },
  { abbr: 'SAG', full: 'Sangres Art Guild', level: 'Member · Westcliffe, CO', logo: '/logos/SangresArtGuild_Logo_RGB_OrangeRed_300dpi_cropped.png' },
];

type ContactStatus = 'idle' | 'loading' | 'success' | 'error';

export default function About() {
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

  return (
    <div className="space-y-12">

      {/* Bio */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <h1 className="section-heading text-4xl font-semibold text-text">Artist Bio</h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6 text-text/80">
            <p>
              'Painter of the West and Its Wild' would be the best description of Melody DeBenedictis' work. Melody has been a full-time professional artist since 2014. Her fine art is focused on the land, the wild, and the wild mustang that call these lands home. Over the last 14 years Melody has traveled the western open lands extensively photographing and experiencing the wild that she incorporates in her paintings.
            </p>
            <p>
              A strong focus on the wild mustang and equine resonates with having her own wild and domestic horses and is easily seen in her work. She has spent these years showcasing her work in galleries across the west from Jackson Hole to Taos, attending art shows and festivals across the west, her fine art telling the stories of the wild and the wild mustang.
            </p>
            <p>
              She has won numerous awards over the years. Throughout her travels she has been in magazines, newspaper articles and radio. Melody has been called prolific in her career as an artist. Her work is a mix of realism and surrealism with a vivid color palette.
            </p>
            <Link to="/commission" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-accent transition hover:text-accentHover">
              Commission a Painting
            </Link>
          </div>

          {/* Memberships — replace logos with <img> tags once assets are available */}
          <div className="rounded-[2rem] border border-border bg-bg/80 p-8">
            <h2 className="section-heading text-2xl font-semibold text-text">Professional memberships</h2>
            <div className="mt-6 flex flex-col gap-4">
              {memberships.map((m) => (
                <div key={m.abbr} className="flex items-center gap-4 rounded-xl border border-border bg-surface/60 px-5 py-4">
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-black/40">
                    <img src={m.logo} alt={m.abbr} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{m.full}</p>
                    <p className="text-xs text-text/60 mt-0.5">{m.level}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Artist Statement */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <h2 className="section-heading text-3xl font-semibold text-text">Artist Statement</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-accent/80">The Art, Music and Songwriting…</p>
        <div className="mt-8 space-y-6 text-text/80 leading-relaxed">
          <p>
            My art journey began early on as a child. Spending summers on my grandparents farm in southern Florida with a herd of horses and a variety of other animals only encouraged the creative aspirations within. If I wasn't out riding a horse, I would be indoors sketching or painting horses. By the time I reached my late teens I had a strong focus on art classes in high school and had a watercolor painting and pencil drawing awarded to the 'Smithsonian Museum' and attended 'Crealde Art Institute' from a scholarship offered in my senior year of high school. Though I took a photography class rather than a painting class, this helped me to understand the importance of capturing 'light', this translates in my work even today.
          </p>
          <p>
            During my late teens and early twenties, I spent most of my summers attending art shows throughout Florida, including the highly recognized 'Winter Park' Art show. During my early twenties I got involved in Interior Design and didn't create art for years. It would be in my late forties before I had the desire to begin creating again.
          </p>
          <p>
            Turning 50, I moved west to Colorado from the east with intentions of getting back to my creative roots. I have been a full time artist since 2014. A self-taught artist with no formal training since graduating high school. I constantly challenge myself and study building my artistic skills and develop the style that I have reached to date. With a blend of realism and surrealism how I approach each unique piece. I have been called prolific in my work and am known for the intense color palette and emotion conveyed in each piece. The impact the west during my first 'wild horse range' trip in NW Colorado has kept my passion fueled. Little did I know the impact that first trip would make on my journey of creating art.
          </p>
          <p>
            The paintings I create in oil inspired by the land, the wild, and the wild mustang that call these western lands home. I would call myself a 'purist' in my artistic approach as I do not use projector or grids, rather continue to develop eye to hand to canvas skill. The theme and color palette of my work is vivid, bringing the experiences I have encountered alive to retell their story on canvas. I have spent the last 14 years traveling across the western states on rugged open range photographing and exploring the wild of our west. My story has been told in newspaper articles, magazines, and radio over the years, and continues to be told today with each new range trip traversing across rugged landscapes, and spending studio time recreating those cherished experiences.
          </p>
        </div>
      </section>

      {/* Exhibitions */}
      <section className="rounded-[2rem] border border-border bg-surface/80 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Shows &amp; Exhibitions</p>
        <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Selected exhibitions</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {exhibitions.map((e, i) => (
            <li key={i} className="flex items-baseline gap-3 text-sm text-text/80">
              <span className="shrink-0 tabular-nums text-accent/70">{e.year}</span>
              <span>{e.name}<span className="text-text/50"> · {e.location}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* Awards + Media */}
      <section className="grid gap-8 lg:grid-cols-2">
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

        <div className="space-y-8">
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
        </div>
      </section>

      {/* General contact */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Get in touch</p>
        <h2 className="section-heading mt-4 text-3xl font-semibold text-text">Have a question or just want to say hello, send us a note.</h2>
        <p className="section-heading mt-2 text-3xl font-semibold text-text">Press inquiries, speaking engagements.</p>
        <p className="mt-4 text-text/70">For painting inquiries, commission requests, or class sign-ups use the dedicated forms.</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 text-text/70">
            <p>Melody works from her studio in Westcliffe, Colorado and will follow up directly by email or phone.</p>
            <div className="rounded-[1.5rem] border border-border bg-bg/80 px-6 py-5 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-2">Studio</p>
              <p>Westcliffe, Colorado</p>
              <p className="mt-2 text-text/50">By appointment</p>
            </div>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-bg/90 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Message sent</p>
              <h3 className="section-heading mt-4 text-2xl font-semibold text-text">Thank you!</h3>
              <p className="mt-4 text-text/70">Melody will be in touch soon.</p>
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
