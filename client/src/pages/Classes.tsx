import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Classes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
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
        body: JSON.stringify({ ...form, subject: 'One-on-One Classes Inquiry' }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setStatus('idle');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="space-y-12">
      <section className="rounded-[2.5rem] border border-border bg-surface/90 p-10 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-accent/90">Classes &amp; Workshops</p>
        <h1 className="section-heading mt-4 text-4xl font-semibold text-text">Learn to paint the West.</h1>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-border bg-surface/80 p-8 shadow-soft flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent/90">One-on-One</p>
            <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Private instruction with Melody</h2>
          </div>
          <p className="text-text/80 leading-8">
            Melody offers private one-on-one instruction on an ongoing basis from her Westcliffe studio.
            Classes are structured as six two-hour sessions, tailored to your skill level and goals —
            whether you're new to oil painting or deepening an existing practice.
          </p>
          <div className="mt-auto">
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover"
            >
              Inquire about classes
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-[#181513]/90 p-8 shadow-soft flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Coming soon</p>
            <h2 className="section-heading mt-3 text-2xl font-semibold text-text">Group classes</h2>
          </div>
          <p className="text-text/75 leading-8">
            Group workshop sessions are in the works. Check back here or subscribe to the newsletter to be
            notified when dates are announced.
          </p>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-bg p-8 shadow-xl">
            {status === 'success' ? (
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold text-text">Thank you!</p>
                <p className="text-text/70">Melody will be in touch about one-on-one classes.</p>
                <button onClick={closeModal} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Inquire</p>
                  <h2 className="section-heading mt-2 text-2xl font-semibold text-text">One-on-One Classes</h2>
                  <p className="mt-1 text-sm text-text/60">Westcliffe, CO</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={set('name')}
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={set('email')}
                        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Message</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Tell Melody a little about your experience and what you'd like to work on."
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                    />
                  </div>
                  {status === 'error' && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="rounded-md border border-border px-4 py-2 text-sm text-text/70 transition hover:border-accent hover:text-text">
                      Cancel
                    </button>
                    <button type="submit" disabled={status === 'loading'} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-60">
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
