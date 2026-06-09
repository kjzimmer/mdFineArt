import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="space-y-12">
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">About Melody</p>
        <h1 className="section-heading mt-4 text-4xl font-semibold text-text">A contemporary western painter grounded in place and atmosphere.</h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6 text-text/80">
            <p>
              Melody DeBenedictis works from her Colorado studio, where broad skies and rugged terrain shape every painting. Her practice is rooted in traditional oil technique, and her work is focused on the stillness and motion of the western landscape and its animals.
            </p>
            <p>
              She builds compositions using color, light, and emotional weight rather than literal detail. The result is a quiet energy balanced with strong atmosphere and collector-friendly scale.
            </p>
            <p>
              This site is designed to evolve with the studio: it begins as a visual library of originals and prints, then extends into commissions, storytelling, and media-rich display.
            </p>
          </div>
          <div className="rounded-[2rem] border border-border bg-bg/80 p-8">
            <h2 className="section-heading text-2xl font-semibold text-text">Studio highlights</h2>
            <ul className="mt-6 space-y-4 text-text/80">
              <li>• Oil painting on gallery wrap canvas</li>
              <li>• Subject focus: Mustangs, wildlife, landscapes, portraits</li>
              <li>• Works by commission and selected originals</li>
              <li>• Prints available as archival paper and canvas</li>
              <li>• Based in Westcliffe, Colorado</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-border bg-surface/80 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-accent/90">About Melody</p>
          <h2 className="section-heading mt-4 text-3xl font-semibold text-text">Western landscapes, equine portraits, and a love for storytelling through paint.</h2>
          <p className="mt-6 text-text/80 leading-8">
            Melody paints from her studio in Westcliffe, Colorado, where dramatic skies, rugged terrain, and the quiet intensity of animals shape every composition. Her work blends traditional oil technique with a contemporary, atmospheric edge.
          </p>
          <p className="mt-4 text-text/80 leading-8">
            Each original painting is created with collectors in mind: rich color, thoughtful detail, and a connection to the American West.
          </p>
          <div className="mt-8">
            <Link to="/commission" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-accent transition hover:text-accentHover">
              Commission a Painting
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-border bg-[#181513]/90 p-8 shadow-soft">
          <h3 className="section-heading text-2xl font-semibold text-text">Studio exploration</h3>
          <p className="mt-4 text-text/75 leading-8">
            This site is the beginning of a digital media archive for Melody's work: full-resolution images, prints, blog ideas, events, and commission intake will evolve together as the site grows.
          </p>
          <ul className="mt-8 space-y-4 text-text/80">
            <li>• Responsive gallery with high-quality imagery and art-first presentation</li>
            <li>• Blog and event sections for storytelling and announcements</li>
            <li>• Commission intake that can later become a full workflow</li>
            <li>• Image assets managed as digital media with thumbnails, web exports, and watermarking</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
