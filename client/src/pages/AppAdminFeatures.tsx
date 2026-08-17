import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import type { SubscriptionTier } from './AppAdminSubscriptionTiers';

interface Feature {
  id: string;
  key: string;
  name: string;
  customerDescription: string | null;
  internalNote: string | null;
  status: string;
  category: string | null;
  minimumTierId: string | null;
  enforced: boolean;
}

export default function AppAdminFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Feature[]>('/api/app-admin/features'),
      apiFetch<SubscriptionTier[]>('/api/app-admin/subscription-tiers'),
    ])
      .then(([f, t]) => { setFeatures(f); setTiers(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Feature[]>();
    for (const f of features) {
      const cat = f.category ?? 'Uncategorized';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(f);
    }
    return Array.from(byCategory.entries());
  }, [features]);

  const saveField = async (id: string, patch: Partial<Feature>) => {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    try {
      await apiFetch(`/api/app-admin/features/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    } catch (err) {
      console.error(err);
      apiFetch<Feature[]>('/api/app-admin/features').then(setFeatures).catch(console.error);
    }
  };

  if (loading) return <p className="text-text/50">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text">Features</h2>
        <p className="mt-1 text-sm text-text/50">
          Descriptions and minimum tier are editable here. Adding or removing a feature itself is
          done in code, not this panel. "Enforced" means this feature actually gets turned on/off
          by tier assignment today — the rest is catalog data for now.
        </p>
      </div>

      {grouped.map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text/40">{category}</h3>
          <div className="space-y-3">
            {items.map((f) => (
              <div key={f.id} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-text">{f.name}</p>
                  <span className="rounded-full bg-border px-2 py-0.5 text-[11px] text-text/50">{f.key}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${f.status === 'shipped' ? 'bg-success/15 text-success' : 'bg-text/10 text-text/50'}`}>
                    {f.status}
                  </span>
                  {f.enforced ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">Enforced</span>
                  ) : (
                    <span className="rounded-full bg-text/10 px-2 py-0.5 text-[11px] text-text/40">Data only — no gate yet</span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-text/50">Customer-facing description</p>
                    <textarea
                      defaultValue={f.customerDescription ?? ''}
                      onBlur={(e) => saveField(f.id, { customerDescription: e.target.value || null })}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-text/50">Internal note</p>
                    <textarea
                      defaultValue={f.internalNote ?? ''}
                      onBlur={(e) => saveField(f.id, { internalNote: e.target.value || null })}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text/70 outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-text/50">Minimum tier</p>
                  <select
                    value={f.minimumTierId ?? ''}
                    onChange={(e) => saveField(f.id, { minimumTierId: e.target.value || null })}
                    className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
                  >
                    <option value="">Ungated (every tier)</option>
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
