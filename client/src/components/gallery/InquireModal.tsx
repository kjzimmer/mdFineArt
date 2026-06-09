import { useState } from 'react';
import type { Painting } from '../../types';

export function InquireModal({
  painting,
  onClose,
}: {
  painting: Painting;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: `Inquiry: ${painting.title}`,
          message,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError('Failed to send — please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-bg p-8 shadow-xl">
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-text">Thank you!</p>
            <p className="text-text/70">Your inquiry about &ldquo;{painting.title}&rdquo; has been sent. We&apos;ll be in touch soon.</p>
            <button
              onClick={onClose}
              className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-accent/90">Inquire about this painting</p>
              <h2 className="section-heading mt-2 text-2xl font-semibold text-text">{painting.title}</h2>
              <p className="mt-1 text-sm text-text/60">
                {[painting.dimensions, painting.medium].filter(Boolean).join(' · ')}
                {painting.price != null && ` · $${painting.price.toLocaleString()}`}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text/60">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-border px-4 py-2 text-sm text-text/70 transition hover:border-accent hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
