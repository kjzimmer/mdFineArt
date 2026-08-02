import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken } from '../lib/apiFetch';
import { useSiteConfig } from '../context/SiteConfigContext';

interface ClassOffering {
  id: string;
  label: string;
  heading: string;
  description: string;
  inquireSubject: string;
  sortOrder: number;
  published: boolean;
}

const blankOffering = (): Omit<ClassOffering, 'id'> => ({
  label: '', heading: '', description: '', inquireSubject: '', sortOrder: 0, published: true,
});

export default function AdminClasses() {
  const { config, refresh } = useSiteConfig();
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassOffering | null>(null);
  const [form, setForm] = useState(blankOffering());
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Page header local state (auto-saves on blur)
  const [classesLabel, setClassesLabel] = useState(config.classesLabel);
  const [classesHeading, setClassesHeading] = useState(config.classesHeading);

  useEffect(() => {
    setClassesLabel(config.classesLabel);
    setClassesHeading(config.classesHeading);
  }, [config.classesLabel, config.classesHeading]);

  useEffect(() => {
    apiFetch<ClassOffering[]>('/api/classes/all')
      .then(setOfferings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const savePageField = async (patch: Record<string, string | null>) => {
    await apiFetch('/api/config', { method: 'PATCH', body: JSON.stringify(patch) }).catch(console.error);
    refresh();
  };

  const uploadClassesImage = async (file: File) => {
    setImgUploading(true);
    setImgError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getAccessToken();
      const res = await fetch('/api/uploads/config-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }
      const { imageUrl } = await res.json();
      await savePageField({ classesImageUrl: imageUrl });
    } catch (err) {
      setImgError(String(err));
    } finally {
      setImgUploading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...blankOffering(), sortOrder: offerings.length });
    setShowForm(true);
  };
  const openEdit = (o: ClassOffering) => { setEditing(o); setForm({ ...o }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiFetch<ClassOffering>(`/api/classes/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
        setOfferings((prev) => prev.map((o) => o.id === updated.id ? updated : o).sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        const created = await apiFetch<ClassOffering>('/api/classes', { method: 'POST', body: JSON.stringify(form) });
        setOfferings((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      closeForm();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const togglePublished = async (o: ClassOffering) => {
    const updated = await apiFetch<ClassOffering>(`/api/classes/${o.id}`, {
      method: 'PATCH', body: JSON.stringify({ published: !o.published }),
    }).catch(console.error);
    if (updated) setOfferings((prev) => prev.map((x) => x.id === updated.id ? updated : x));
  };

  const deleteOffering = async (o: ClassOffering) => {
    if (!confirm(`Delete "${o.heading}"?`)) return;
    await apiFetch(`/api/classes/${o.id}`, { method: 'DELETE' }).catch(console.error);
    setOfferings((prev) => prev.filter((x) => x.id !== o.id));
  };

  const move = async (o: ClassOffering, dir: -1 | 1) => {
    const sorted = [...offerings].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((x) => x.id === o.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    const [aOrder, bOrder] = [o.sortOrder, swap.sortOrder];
    await Promise.all([
      apiFetch(`/api/classes/${o.id}`, { method: 'PATCH', body: JSON.stringify({ sortOrder: bOrder }) }),
      apiFetch(`/api/classes/${swap.id}`, { method: 'PATCH', body: JSON.stringify({ sortOrder: aOrder }) }),
    ]).catch(console.error);
    setOfferings((prev) => prev.map((x) => {
      if (x.id === o.id) return { ...x, sortOrder: bOrder };
      if (x.id === swap.id) return { ...x, sortOrder: aOrder };
      return x;
    }).sort((a, b) => a.sortOrder - b.sortOrder));
  };

  if (loading) return <p className="text-text/70">Loading…</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-text">Classes</h2>

      {/* Page header settings */}
      <div className="rounded-2xl border border-border bg-surface/80 p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">Page Header</h3>
        <div>
          <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Label (eyebrow text)</label>
          <input value={classesLabel} onChange={(e) => setClassesLabel(e.target.value)}
            onBlur={() => savePageField({ classesLabel })}
            placeholder="Classes & Workshops"
            className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Main Heading</label>
          <input value={classesHeading} onChange={(e) => setClassesHeading(e.target.value)}
            onBlur={() => savePageField({ classesHeading })}
            placeholder="Learn to paint the West."
            className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <label className="block text-xs uppercase tracking-widest text-text/50">Header image (optional)</label>
          <p className="text-xs text-text/40">Shown to the right of the heading on the public Classes page.</p>
          {config.classesImageUrl && (
            <div className="relative inline-block">
              <img src={config.classesImageUrl} alt="" className="h-32 w-48 rounded-xl object-cover" />
              <button type="button"
                onClick={() => savePageField({ classesImageUrl: null })}
                className="absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white/80 transition hover:bg-black/70">
                Remove
              </button>
            </div>
          )}
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; uploadClassesImage(f); } }} />
          <div>
            <button type="button" onClick={() => imgInputRef.current?.click()} disabled={imgUploading}
              className="text-xs text-accent/70 transition hover:text-accent disabled:opacity-40">
              {imgUploading ? 'Uploading…' : config.classesImageUrl ? 'Replace image' : '+ Upload image'}
            </button>
            {imgError && <p className="text-xs text-red-400 mt-1">{imgError}</p>}
          </div>
        </div>
      </div>

      {/* Offerings list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">Class Offerings</h3>
          <button onClick={openNew} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:bg-accentHover">
            + Add Offering
          </button>
        </div>

        {offerings.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface/60 py-12 text-center">
            <p className="text-text/50">No class offerings yet. Add your first one above.</p>
          </div>
        )}

        {offerings.map((o, idx) => (
          <div key={o.id} className="rounded-2xl border border-border bg-surface/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs uppercase tracking-widest text-accent/70">{o.label}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${o.published ? 'bg-green-500/15 text-green-400' : 'bg-border text-text/50'}`}>
                    {o.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="font-semibold text-text">{o.heading}</p>
                <p className="text-sm text-text/60 line-clamp-2">{o.description}</p>
                <p className="text-xs text-text/40">Inquire subject: "{o.inquireSubject}"</p>
              </div>
              <div className="flex shrink-0 gap-2 items-start flex-wrap justify-end">
                <div className="flex gap-1">
                  <button onClick={() => move(o, -1)} disabled={idx === 0}
                    className="rounded border border-border px-2 py-1 text-xs text-text/50 hover:text-text disabled:opacity-30 transition">↑</button>
                  <button onClick={() => move(o, 1)} disabled={idx === offerings.length - 1}
                    className="rounded border border-border px-2 py-1 text-xs text-text/50 hover:text-text disabled:opacity-30 transition">↓</button>
                </div>
                <button onClick={() => togglePublished(o)} className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition">
                  {o.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => openEdit(o)} className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition">
                  Edit
                </button>
                <button onClick={() => deleteOffering(o)} className="text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-bg p-8 shadow-2xl my-auto">
            <h3 className="text-xl font-semibold text-text mb-6">{editing ? 'Edit Offering' : 'New Class Offering'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Label (eyebrow)</label>
                <input required value={form.label} onChange={set('label')} placeholder="One-on-One"
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Heading</label>
                <input required value={form.heading} onChange={set('heading')} placeholder="Private instruction with the artist"
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Description</label>
                <textarea required rows={4} value={form.description} onChange={set('description')}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Inquiry Subject</label>
                <input required value={form.inquireSubject} onChange={set('inquireSubject')} placeholder="One-on-One Classes Inquiry"
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
                <p className="text-xs text-text/40 mt-1">Used as the subject line when a visitor clicks Inquire — helps categorize messages in Inbox.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-accent" />
                <span className="text-sm text-text/70">Published (visible on public site)</span>
              </label>
              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <button type="button" onClick={closeForm}
                  className="rounded-xl border border-border px-5 py-3 text-sm text-text/60 transition hover:text-text">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Offering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
