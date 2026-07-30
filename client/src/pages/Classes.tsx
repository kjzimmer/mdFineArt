import { useEffect, useState } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';

interface ClassOffering {
  id: string;
  label: string;
  heading: string;
  description: string;
  inquireSubject: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Classes() {
  const { config } = useSiteConfig();
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [activeOffering, setActiveOffering] = useState<ClassOffering | null>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    fetch('/api/classes')
      .then((r) => r.json())
      .then(setOfferings)
      .catch(console.error);
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    if (!activeOffering) return;
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subject: activeOffering.inquireSubject }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const closeModal = () => {
    setActiveOffering(null);
    setStatus('idle');
    setForm({ name: '', email: '', message: '' });
  };

  const label = config.classesLabel || 'Classes & Workshops';
  const heading = config.classesHeading || 'Learn with us.';

  return (
    <div className="space-y-12">
      {/* Page header */}
      <section className={`rounded-section border border-border bg-surface/90 p-10 shadow-soft ${config.classesImageUrl ? 'grid gap-8 lg:grid-cols-[1fr_320px] items-center' : ''}`}>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-accent/90">{label}</p>
          <h1 className="section-heading mt-4 text-4xl font-semibold text-text">{heading}</h1>
        </div>
        {config.classesImageUrl && (
          <img
            src={config.classesImageUrl}
            alt={label}
            className="w-full rounded-lg object-cover aspect-[4/3]"
          />
        )}
      </section>

      {/* Class offering cards */}
      {offerings.length > 0 && (
        <section className="grid gap-8 lg:grid-cols-2">
          {offerings.map((o) => (
            <div key={o.id} className="rounded-hero border border-border bg-surface/80 p-8 shadow-soft flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent/90">{o.label}</p>
                <h2 className="section-heading mt-3 text-2xl font-semibold text-text">{o.heading}</h2>
              </div>
              <p className="text-text/80 leading-8">{o.description}</p>
              <div className="mt-auto">
                <button
                  onClick={() => setActiveOffering(o)}
                  className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover"
                >
                  Inquire
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {offerings.length === 0 && (
        <div className="rounded-section border border-border bg-surface/60 py-20 text-center">
          <p className="text-text/50">Class information coming soon.</p>
        </div>
      )}

      {/* Inquiry modal */}
      {activeOffering && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-bg p-8 shadow-xl">
            {status === 'success' ? (
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold text-text">Thank you!</p>
                <p className="text-text/70">Your inquiry has been sent. We'll be in touch soon.</p>
                <button onClick={closeModal} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-accent/90">{activeOffering.label}</p>
                  <h2 className="section-heading mt-2 text-2xl font-semibold text-text">{activeOffering.heading}</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Name</label>
                      <input required value={form.name} onChange={set('name')}
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Email</label>
                      <input type="email" required value={form.email} onChange={set('email')}
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Message</label>
                    <textarea rows={4} value={form.message} onChange={set('message')}
                      placeholder="Tell us a little about your experience and what you'd like to work on."
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent" />
                  </div>
                  {status === 'error' && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={closeModal}
                      className="rounded-md border border-border px-4 py-2 text-sm text-text/70 transition hover:border-accent hover:text-text">
                      Cancel
                    </button>
                    <button type="submit" disabled={status === 'loading'}
                      className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-60">
                      {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
