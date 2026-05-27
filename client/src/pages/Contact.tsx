import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-12">
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Contact</p>
        <h1 className="section-heading mt-4 text-4xl font-semibold text-text">
          Connect with the studio for purchases, commissions, or press inquiries.
        </h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6 text-text/80">
            <p>Prefer a direct note? Share your name, interest, and any relevant details about your inquiry.</p>
            <div className="rounded-[2rem] border border-border bg-bg/90 p-8 text-text/80">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Studio</p>
              <p className="mt-3">Westcliffe, Colorado</p>
              <p className="mt-2">Phone: (505) 429-6597</p>
              <p className="mt-2">Email: hello@melodydebenedictis.com</p>
            </div>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-bg/90 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-accent/90">Message sent</p>
              <h2 className="section-heading mt-4 text-2xl font-semibold text-text">Thank you!</h2>
              <p className="mt-4 text-text/70">Melody will be in touch soon.</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-6 text-sm uppercase tracking-[0.2em] text-accent transition hover:text-accentHover"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-border bg-bg/90 p-8">
              <input
                value={form.name}
                onChange={set('name')}
                required
                className="w-full rounded-3xl border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Name"
              />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full rounded-3xl border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Email"
              />
              <input
                value={form.subject}
                onChange={set('subject')}
                required
                className="w-full rounded-3xl border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Subject"
              />
              <textarea
                rows={6}
                value={form.message}
                onChange={set('message')}
                required
                className="w-full rounded-[2rem] border border-border bg-surface/90 px-5 py-4 text-text outline-none focus:border-accent"
                placeholder="Message"
              />
              {status === 'error' && (
                <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-3xl bg-accent px-6 py-4 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
