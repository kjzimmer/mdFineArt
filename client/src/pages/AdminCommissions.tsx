import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';
import { SlideshowEditor } from '../components/admin/SlideshowEditor';
import { TestimonialsEditor } from '../components/admin/TestimonialsEditor';

interface CommissionRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminCommissions() {
  const { config, refresh } = useSiteConfig();
  const [commissions, setCommissions] = useState<CommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Page header local state (auto-saves on blur)
  const [commissionTitle, setCommissionTitle] = useState(config.commissionTitle);
  const [commissionBody, setCommissionBody] = useState(config.commissionBody);

  useEffect(() => {
    setCommissionTitle(config.commissionTitle);
    setCommissionBody(config.commissionBody);
  }, [config.commissionTitle, config.commissionBody]);

  useEffect(() => {
    apiFetch<CommissionRequest[]>('/api/commissions')
      .then(setCommissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const savePageField = async (patch: Record<string, string | string[] | null>) => {
    await apiFetch('/api/config', { method: 'PATCH', body: JSON.stringify(patch) }).catch(console.error);
    refresh();
  };

  const updateBody = (i: number, value: string) => {
    setCommissionBody((prev) => { const next = [...prev]; next[i] = value; return next; });
  };
  const removeBody = (i: number) => {
    const next = commissionBody.filter((_, idx) => idx !== i);
    setCommissionBody(next);
    savePageField({ commissionBody: next });
  };
  const addBody = () => setCommissionBody((prev) => [...prev, '']);

  if (loading) return <p className="text-text/70">Loading commissions…</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-text">Commissions</h2>

      {/* Page header settings */}
      <div className="rounded-2xl border border-border bg-surface/80 p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">Page Header</h3>
        <div>
          <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Page title</label>
          <input value={commissionTitle} onChange={(e) => setCommissionTitle(e.target.value)}
            onBlur={() => savePageField({ commissionTitle })}
            placeholder="Commission"
            className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <label className="block text-xs uppercase tracking-widest text-text/50">Intro paragraphs</label>
          {commissionBody.map((para, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                rows={3}
                value={para}
                onChange={(e) => updateBody(i, e.target.value)}
                onBlur={() => savePageField({ commissionBody })}
                className="flex-1 resize-none rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent"
              />
              <button type="button" onClick={() => removeBody(i)} className="mt-2 text-xs text-text/40 transition hover:text-red-400">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addBody} className="text-xs text-accent/70 transition hover:text-accent">
            + Add paragraph
          </button>
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <label className="block text-xs uppercase tracking-widest text-text/50">Slideshow (optional)</label>
          <p className="text-xs text-text/40">Images appear on the right side of the commission intro.</p>
          <SlideshowEditor context="commission" />
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <label className="block text-xs uppercase tracking-widest text-text/50">Testimonials</label>
          <p className="text-xs text-text/40">Shown below the intro on the public Commission page.</p>
          <TestimonialsEditor context="commission" />
        </div>
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">Commission Requests</h3>
        {!commissions.length && <p className="text-text/60">No commission requests yet.</p>}
        {commissions.map((req) => (
          <div key={req.id} className="rounded-xl border border-border bg-bg/90 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-text">
                  {req.name}{' '}
                  <span className="text-sm font-normal text-text/60">— {req.email}</span>
                </p>
                <p className="mt-1 text-sm text-text/70">{req.subject}</p>
                <p className="mt-1 text-xs text-text/50">
                  {new Date(req.createdAt).toLocaleDateString()} ·{' '}
                  <span className="uppercase tracking-wider">{req.status}</span>
                </p>
              </div>
              <button
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                className="flex-shrink-0 text-xs uppercase tracking-widest text-text/50 hover:text-text transition"
              >
                {expanded === req.id ? 'Close' : 'View'}
              </button>
            </div>
            {expanded === req.id && (
              <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4 text-sm text-text/80 whitespace-pre-wrap leading-7">
                {req.description}
                {req.phone && <p className="mt-3 text-text/60">Phone: {req.phone}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
