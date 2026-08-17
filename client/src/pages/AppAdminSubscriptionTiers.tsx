import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string | null;
  previousTierId: string | null;
}

export default function AppAdminSubscriptionTiers() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiFetch<SubscriptionTier[]>('/api/app-admin/subscription-tiers')
      .then(setTiers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveField = async (id: string, patch: Partial<SubscriptionTier>) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await apiFetch(`/api/app-admin/subscription-tiers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    } catch (err) {
      console.error(err);
      load(); // revert to server truth on failure
    }
  };

  const createTier = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/api/app-admin/subscription-tiers', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName('');
      load();
    } catch (err) {
      console.error(err);
      setError('Failed to create tier.');
    } finally {
      setCreating(false);
    }
  };

  const deleteTier = async (tier: SubscriptionTier) => {
    if (!confirm(`Delete "${tier.name}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/api/app-admin/subscription-tiers/${tier.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const match = msg.match(/- (.+)$/s);
      let friendly = 'Delete failed.';
      if (match) {
        try { friendly = (JSON.parse(match[1]) as { error?: string }).error ?? friendly; } catch { /* keep default */ }
      }
      alert(friendly);
    }
  };

  if (loading) return <p className="text-text/50">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">Subscription Tiers</h2>
        <p className="mt-1 text-sm text-text/50">
          Ordered lowest to highest — each tier includes everything the ones below it have.
        </p>
      </div>

      {tiers.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface/60 py-16 text-center">
          <p className="text-text/40">No tiers yet — add the first one below.</p>
        </div>
      )}

      <div className="space-y-3">
        {tiers.map((tier, i) => (
          <div key={tier.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    Level {i + 1}
                  </span>
                  <input
                    defaultValue={tier.name}
                    onBlur={(e) => { if (e.target.value.trim() && e.target.value !== tier.name) saveField(tier.id, { name: e.target.value.trim() }); }}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-text outline-none focus:border-accent"
                  />
                </div>
                <textarea
                  defaultValue={tier.description ?? ''}
                  onBlur={(e) => saveField(tier.id, { description: e.target.value || null })}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text/80 outline-none placeholder:text-text/30 focus:border-accent"
                />
              </div>
              <button
                onClick={() => deleteTier(tier)}
                className="shrink-0 text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border p-5">
        <p className="mb-3 text-sm font-medium text-text">Add a new tier</p>
        <p className="mb-3 text-xs text-text/40">New tiers are always added at the top of the chain (the highest level).</p>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tier name"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none placeholder:text-text/30 focus:border-accent"
          />
          <button
            onClick={createTier}
            disabled={creating || !newName.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
          >
            {creating ? 'Adding…' : 'Add Tier'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
