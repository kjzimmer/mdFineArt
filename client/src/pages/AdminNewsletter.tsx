import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';

interface Subscriber {
  id: string;
  active: boolean;
  subscribedAt: string;
  source: string | null;
  person: { id: string; name: string; email: string };
}

export default function AdminNewsletter() {
  const { config, refresh } = useSiteConfig();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Page header local state (auto-saves on blur)
  const [newsletterTitle, setNewsletterTitle] = useState(config.newsletterTitle);
  const [newsletterTagline, setNewsletterTagline] = useState(config.newsletterTagline);

  useEffect(() => {
    setNewsletterTitle(config.newsletterTitle);
    setNewsletterTagline(config.newsletterTagline);
  }, [config.newsletterTitle, config.newsletterTagline]);

  useEffect(() => {
    apiFetch<Subscriber[]>('/api/newsletter/subscribers')
      .then(setSubscribers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const savePageField = async (patch: Record<string, string | null>) => {
    await apiFetch('/api/config', { method: 'PATCH', body: JSON.stringify(patch) }).catch(console.error);
    refresh();
  };

  const activeSubscribers = subscribers.filter((s) => s.active);

  const copySubscriberEmails = () => {
    const emails = activeSubscribers.map((s) => s.person.email).join(', ');
    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleActive = async (s: Subscriber) => {
    const updated = await apiFetch<Subscriber>(`/api/newsletter/subscribers/${s.id}`, {
      method: 'PATCH', body: JSON.stringify({ active: !s.active }),
    }).catch(console.error);
    if (updated) setSubscribers((prev) => prev.map((x) => x.id === updated.id ? updated : x));
  };

  if (loading) return <p className="text-text/70">Loading…</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-text">Newsletter</h2>

      {/* Page header settings */}
      <div className="rounded-2xl border border-border bg-surface/80 p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">Signup Card</h3>
        <div>
          <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Section heading</label>
          <input value={newsletterTitle} onChange={(e) => setNewsletterTitle(e.target.value)}
            onBlur={() => savePageField({ newsletterTitle })}
            className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Description</label>
          <input value={newsletterTagline} onChange={(e) => setNewsletterTagline(e.target.value)}
            onBlur={() => savePageField({ newsletterTagline })}
            className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
        </div>
      </div>

      {/* Subscribers list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">Subscribers</h3>
          {activeSubscribers.length > 0 && (
            <button onClick={copySubscriberEmails} className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition">
              {copied ? 'Copied!' : `Copy ${activeSubscribers.length} subscriber email${activeSubscribers.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>

        {subscribers.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface/60 py-12 text-center">
            <p className="text-text/50">No subscribers yet.</p>
          </div>
        )}

        {subscribers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/80 p-5">
            <div className="min-w-0">
              <p className="font-semibold text-text">{s.person.name}</p>
              <p className="text-sm text-text/60">{s.person.email}</p>
              <p className="text-xs text-text/40 mt-0.5">Subscribed {new Date(s.subscribedAt).toLocaleDateString()}{s.source ? ` · ${s.source}` : ''}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.active ? 'bg-green-500/15 text-green-400' : 'bg-border text-text/50'}`}>
                {s.active ? 'Active' : 'Unsubscribed'}
              </span>
              <button onClick={() => toggleActive(s)} className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition">
                {s.active ? 'Unsubscribe' : 'Resubscribe'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
