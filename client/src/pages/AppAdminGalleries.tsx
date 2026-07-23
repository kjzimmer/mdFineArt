import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';

interface GalleryRow {
  id: string;
  slug: string;
  name: string;
  customDomain: string | null;
  active: boolean;
  createdAt: string;
  _count: { paintings: number; subscribers: number; memberships: number };
}

interface NewGalleryForm {
  slug: string;
  name: string;
  customDomain: string;
}

export default function AppAdminGalleries() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewGalleryForm>({ slug: '', name: '', customDomain: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<GalleryRow[]>('/api/app-admin/galleries')
      .then(setGalleries)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await apiFetch<GalleryRow>('/api/app-admin/galleries', {
        method: 'POST',
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          customDomain: form.customDomain || null,
        }),
      });
      setGalleries((prev) => [...prev, created]);
      setShowForm(false);
      setForm({ slug: '', name: '', customDomain: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gallery');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-text/40 text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text">Galleries</h1>
          <p className="mt-1 text-sm text-text/50">{galleries.length} gallery{galleries.length !== 1 ? 'ies' : 'y'} on this platform</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover"
        >
          + New Gallery
        </button>
      </div>

      {/* New gallery form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-border bg-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-text/70">Provision New Gallery</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/50 mb-1">Slug <span className="text-red-400">*</span></label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="jane-smith"
                required
                className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/50 mb-1">Name <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith Fine Art"
                required
                className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text/50 mb-1">Custom Domain</label>
            <input
              value={form.customDomain}
              onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
              placeholder="janesmith.com"
              className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Gallery'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="rounded-xl border border-border px-5 py-2 text-sm text-text/60 transition hover:text-text"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Gallery table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/60">
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-text/40 font-medium">Gallery</th>
              <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-text/40 font-medium">Domain</th>
              <th className="px-5 py-3 text-center text-xs uppercase tracking-wider text-text/40 font-medium">Status</th>
              <th className="px-5 py-3 text-center text-xs uppercase tracking-wider text-text/40 font-medium">Paintings</th>
              <th className="px-5 py-3 text-center text-xs uppercase tracking-wider text-text/40 font-medium">Members</th>
              <th className="px-5 py-3 text-center text-xs uppercase tracking-wider text-text/40 font-medium">Subscribers</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {galleries.map((g, i) => (
              <tr
                key={g.id}
                className={`border-b border-border last:border-0 hover:bg-surface/40 transition cursor-pointer ${i % 2 === 0 ? '' : 'bg-surface/20'}`}
                onClick={() => navigate(`/app-admin/galleries/${g.id}`)}
              >
                <td className="px-5 py-3.5">
                  <div className="font-medium text-text">{g.name}</div>
                  <div className="text-xs text-text/40 mt-0.5">{g.slug}</div>
                </td>
                <td className="px-5 py-3.5 text-text/60">{g.customDomain ?? <span className="text-text/30 italic">not set</span>}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    g.active ? 'bg-green-500/15 text-green-400' : 'bg-text/10 text-text/40'
                  }`}>
                    {g.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center text-text/70">{g._count.paintings}</td>
                <td className="px-5 py-3.5 text-center text-text/70">{g._count.memberships}</td>
                <td className="px-5 py-3.5 text-center text-text/70">{g._count.subscribers}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-xs uppercase tracking-wider text-accent/70">Manage →</span>
                </td>
              </tr>
            ))}
            {galleries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-text/40">No galleries yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
