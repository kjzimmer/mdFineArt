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
    </div>
  );
}
