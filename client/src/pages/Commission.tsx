import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Commission() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', description: '' });
  const [status, setStatus] = useState<Status>('idle');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', description: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-12">
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Commission</p>
        <h1 className="section-heading mt-4 text-4xl font-semibold text-text">
          Create a custom western painting for your collection.
        </h1>
        <div className="mt-8 max-w-2xl space-y-6 text-text/80">
          <p>
            Melody accepts commission inquiries for original paintings in a range of sizes and western themes.
            Start with a concept, reference photos, or a story you want captured in oil.
          </p>
          <p>
            We'll refine the idea, agree on a budget and timeline, and work together through sketch, progress
            updates, and final delivery.
          </p>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Inquiry received</p>
            <h2 className="section-heading mt-4 text-3xl font-semibold text-text">Thank you!</h2>
            <p className="mt-4 max-w-sm text-text/70">
              Melody will review your inquiry and follow up within a few days.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm uppercase tracking-[0.2em] text-accent transition hover:text-accentHover"
            >
              Submit another inquiry
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h2 className="section-heading text-3xl font-semibold text-text">Commission Inquiry</h2>
              <p className="max-w-3xl text-text/75">Use this form to describe your vision.</p>
            </div>
            <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-2">
              <input
                value={form.name}
                onChange={set('name')}
                required
                className="rounded-3xl border border-border bg-bg/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Name"
              />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="rounded-3xl border border-border bg-bg/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Email"
              />
              <input
                value={form.phone}
                onChange={set('phone')}
                className="rounded-3xl border border-border bg-bg/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Phone (optional)"
              />
              <input
                value={form.subject}
                onChange={set('subject')}
                required
                className="rounded-3xl border border-border bg-bg/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Subject or idea"
              />
              <textarea
                rows={6}
                value={form.description}
                onChange={set('description')}
                required
                className="col-span-full rounded-[2rem] border border-border bg-bg/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Describe your vision, size, budget, and reference details"
              />
              {status === 'error' && (
                <p className="col-span-full text-sm text-red-400">Something went wrong. Please try again.</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="col-span-full rounded-3xl bg-accent px-6 py-4 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending…' : 'Send inquiry'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
