import { Link } from 'react-router-dom';

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
  { year: 2023, name: 'Melody DeBenedictis Fine Art Gallery', location: 'Westcliffe, CO' },
];

const memberships = [
  { abbr: 'CAA', full: 'Cowgirl Artists of America', level: 'PRO Member', logo: '/logos/caa.jpg' },
  { abbr: 'WAOW', full: 'Women Artists of the West', level: 'Associate Member', logo: '/logos/WAOW_Logo-Chrome+on+Blk.jpg' },
  { abbr: 'SAG', full: 'Sangres Art Guild', level: 'Member · Westcliffe, CO', logo: '/logos/SangresArtGuild_Logo_RGB_OrangeRed_300dpi_cropped.png' },
];

export default function About() {
  return (
    <div className="space-y-12">

      {/* Bio */}
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">About Melody</p>
        <h1 className="section-heading mt-4 text-4xl font-semibold text-text">A contemporary western painter grounded in place and atmosphere.</h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6 text-text/80">
            <p>
              Melody DeBenedictis paints from her studio in Westcliffe, Colorado, where dramatic skies, rugged terrain, and the quiet intensity of animals shape every composition. Her practice is rooted in traditional oil technique, focused on the stillness and motion of the western landscape and its horses and wildlife.
            </p>
            <p>
              She builds compositions using color, light, and emotional weight rather than literal detail — a quiet energy balanced with strong atmosphere and collector-friendly scale.
            </p>
            <p>
              Each original painting is created with collectors in mind: rich color, thoughtful detail, and a deep connection to the American West.
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

    </div>
  );
}
