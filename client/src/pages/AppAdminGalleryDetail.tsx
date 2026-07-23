import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';

interface Member {
  id: string;
  isAdmin: boolean;
  person: { id: string; name: string; email: string };
}

interface GalleryDetail {
  id: string;
  slug: string;
  name: string;
  customDomain: string | null;
  previewDomain: string | null;
  cfZoneId: string | null;
  active: boolean;
  memberships: Member[];
  _count: { paintings: number; subscribers: number };
}

export default function AppAdminGalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<GalleryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Preview provisioning
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState('');

  // Add member
  const [memberEmail, setMemberEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberIsAdmin, setMemberIsAdmin] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    apiFetch<GalleryDetail>(`/api/app-admin/galleries/${id}`)
      .then((g) => {
        setGallery(g);
        setName(g.name);
        setDomain(g.customDomain ?? '');
        setActive(g.active);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await apiFetch<GalleryDetail>(`/api/app-admin/galleries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, customDomain: domain || null, active }),
      });
      setGallery((prev) => prev ? { ...prev, ...updated } : prev);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionPreview = async () => {
    setProvisioning(true);
    setProvisionMsg('');
    try {
      const result = await apiFetch<{ previewDomain: string }>(`/api/app-admin/galleries/${id}/provision-preview`, {
        method: 'POST',
      });
      setGallery((prev) => prev ? { ...prev, previewDomain: result.previewDomain } : prev);
      setProvisionMsg('Preview URL created');
      setTimeout(() => setProvisionMsg(''), 3000);
    } catch (err) {
      setProvisionMsg(err instanceof Error ? err.message : 'Provisioning failed');
    } finally {
      setProvisioning(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    setAddingMember(true);
    try {
      const membership = await apiFetch<Member>(`/api/app-admin/galleries/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail, name: memberName || undefined, isAdmin: memberIsAdmin }),
      });
      setGallery((prev) => prev ? { ...prev, memberships: [...prev.memberships, membership] } : prev);
      setMemberEmail('');
      setMemberName('');
      setMemberIsAdmin(false);
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleToggleAdmin = async (personId: string, current: boolean) => {
    try {
      const updated = await apiFetch<Member>(`/api/app-admin/galleries/${id}/members/${personId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAdmin: !current }),
      });
      setGallery((prev) => prev ? {
        ...prev,
        memberships: prev.memberships.map((m) => m.person.id === personId ? updated : m),
      } : prev);
    } catch { /* ignore */ }
  };

  const handleRemoveMember = async (personId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await apiFetch(`/api/app-admin/galleries/${id}/members/${personId}`, { method: 'DELETE' });
      setGallery((prev) => prev ? {
        ...prev,
        memberships: prev.memberships.filter((m) => m.person.id !== personId),
      } : prev);
    } catch { /* ignore */ }
  };

  if (loading) return <div className="text-text/40 text-sm">Loading…</div>;
  if (!gallery) return <div className="text-text/40 text-sm">Gallery not found</div>;

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => navigate('/app-admin')}
        className="mb-6 text-xs uppercase tracking-wider text-text/40 hover:text-text transition"
      >
        ← All Galleries
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text">{gallery.name}</h1>
          <p className="mt-1 text-sm text-text/50">
            {gallery._count.paintings} painting{gallery._count.paintings !== 1 ? 's' : ''} · {gallery._count.subscribers} subscriber{gallery._count.subscribers !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
          gallery.active ? 'bg-green-500/15 text-green-400' : 'bg-text/10 text-text/40'
        }`}>
          {gallery.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery settings */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-text/50 mb-5">Gallery Settings</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/40 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/40 mb-1">Slug</label>
              <input
                value={gallery.slug}
                readOnly
                className="w-full rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm text-text/40 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/40 mb-1">Preview URL</label>
              {gallery.previewDomain ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${gallery.previewDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    {gallery.previewDomain}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text/30 italic">Not provisioned</span>
                  <button
                    type="button"
                    onClick={handleProvisionPreview}
                    disabled={provisioning}
                    className="rounded-lg bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition disabled:opacity-50"
                  >
                    {provisioning ? 'Provisioning…' : 'Generate'}
                  </button>
                </div>
              )}
              {provisionMsg && (
                <p className={`mt-1 text-xs ${provisionMsg === 'Preview URL created' ? 'text-green-400' : 'text-red-400'}`}>
                  {provisionMsg}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/40 mb-1">Analytics Zone</label>
              <span className={`text-sm ${gallery.cfZoneId ? 'text-green-400' : 'text-text/30 italic'}`}>
                {gallery.cfZoneId ? `Linked (${gallery.cfZoneId.slice(0, 8)}…)` : 'Not linked — set custom domain to auto-link'}
              </span>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-text/40 mb-1">Custom Domain</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="artist.com"
                className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  active ? 'bg-accent' : 'bg-text/20'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-text/70">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saveMsg && (
                <span className={`text-sm ${saveMsg === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-text/50 mb-5">Members</h2>

          {gallery.memberships.length > 0 ? (
            <div className="space-y-2 mb-6">
              {gallery.memberships.map((m) => (
                <div key={m.person.id} className="flex items-center justify-between rounded-lg border border-border bg-bg/40 px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-text">{m.person.name}</div>
                    <div className="text-xs text-text/40">{m.person.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAdmin(m.person.id, m.isAdmin)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                        m.isAdmin
                          ? 'bg-accent/20 text-accent hover:bg-accent/30'
                          : 'bg-text/10 text-text/40 hover:bg-text/20'
                      }`}
                    >
                      {m.isAdmin ? 'Admin' : 'Member'}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.person.id)}
                      className="text-xs text-text/30 hover:text-red-400 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text/40 mb-6">No members yet</p>
          )}

          {/* Add member form */}
          <form onSubmit={handleAddMember} className="space-y-3 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-text/40">Add Member</p>
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Name (optional — used if creating new account)"
              className="w-full rounded-lg border border-border bg-bg/80 px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={memberIsAdmin}
                onChange={(e) => setMemberIsAdmin(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-text/70">Gallery admin</span>
            </label>
            {memberError && <p className="text-sm text-red-400">{memberError}</p>}
            <button
              type="submit"
              disabled={addingMember}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
            >
              {addingMember ? 'Adding…' : 'Add Member'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
