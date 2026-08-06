import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken } from '../../lib/apiFetch';

interface Testimonial {
  id: string;
  authorName: string;
  authorDetail: string | null;
  quote: string;
  photoUrl: string | null;
  sortOrder: number;
  published: boolean;
}

const blankTestimonial = (): Omit<Testimonial, 'id'> => ({
  authorName: '', authorDetail: '', quote: '', photoUrl: null, sortOrder: 0, published: true,
});

interface Props {
  context: string;
}

export function TestimonialsEditor({ context }: Props) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(blankTestimonial());
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    apiFetch<Testimonial[]>(`/api/testimonials/${context}/all`)
      .then(setTestimonials)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [context]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true);
    setPhotoError(null);
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
      setForm((f) => ({ ...f, photoUrl: imageUrl }));
    } catch (err) {
      setPhotoError(String(err));
    } finally {
      setPhotoUploading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...blankTestimonial(), sortOrder: testimonials.length });
    setShowForm(true);
  };
  const openEdit = (t: Testimonial) => { setEditing(t); setForm({ ...t }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setPhotoError(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiFetch<Testimonial>(`/api/testimonials/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
        setTestimonials((prev) => prev.map((t) => t.id === updated.id ? updated : t).sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        const created = await apiFetch<Testimonial>(`/api/testimonials/${context}`, { method: 'POST', body: JSON.stringify(form) });
        setTestimonials((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      closeForm();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const togglePublished = async (t: Testimonial) => {
    const updated = await apiFetch<Testimonial>(`/api/testimonials/${t.id}`, {
      method: 'PATCH', body: JSON.stringify({ published: !t.published }),
    }).catch(console.error);
    if (updated) setTestimonials((prev) => prev.map((x) => x.id === updated.id ? updated : x));
  };

  const deleteTestimonial = async (t: Testimonial) => {
    if (!confirm(`Delete testimonial from "${t.authorName}"?`)) return;
    await apiFetch(`/api/testimonials/${t.id}`, { method: 'DELETE' }).catch(console.error);
    setTestimonials((prev) => prev.filter((x) => x.id !== t.id));
  };

  const move = async (t: Testimonial, dir: -1 | 1) => {
    const sorted = [...testimonials].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((x) => x.id === t.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    const [aOrder, bOrder] = [t.sortOrder, swap.sortOrder];
    await Promise.all([
      apiFetch(`/api/testimonials/${t.id}`, { method: 'PATCH', body: JSON.stringify({ sortOrder: bOrder }) }),
      apiFetch(`/api/testimonials/${swap.id}`, { method: 'PATCH', body: JSON.stringify({ sortOrder: aOrder }) }),
    ]).catch(console.error);
    setTestimonials((prev) => prev.map((x) => {
      if (x.id === t.id) return { ...x, sortOrder: bOrder };
      if (x.id === swap.id) return { ...x, sortOrder: aOrder };
      return x;
    }).sort((a, b) => a.sortOrder - b.sortOrder));
  };

  if (loading) return <p className="text-text/70 text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={openNew} className="text-xs text-accent/70 transition hover:text-accent">
          + Add testimonial
        </button>
      </div>

      {testimonials.length === 0 && (
        <p className="text-xs text-text/40 italic">No testimonials yet.</p>
      )}

      {testimonials.map((t, idx) => (
        <div key={t.id} className="rounded-2xl border border-border bg-surface/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {t.photoUrl && <img src={t.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-text">{t.authorName}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.published ? 'bg-green-500/15 text-green-400' : 'bg-border text-text/50'}`}>
                    {t.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                {t.authorDetail && <p className="text-xs text-text/50">{t.authorDetail}</p>}
                <p className="text-sm text-text/60 line-clamp-2">&ldquo;{t.quote}&rdquo;</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 items-start flex-wrap justify-end">
              <div className="flex gap-1">
                <button onClick={() => move(t, -1)} disabled={idx === 0}
                  className="rounded border border-border px-2 py-1 text-xs text-text/50 hover:text-text disabled:opacity-30 transition">↑</button>
                <button onClick={() => move(t, 1)} disabled={idx === testimonials.length - 1}
                  className="rounded border border-border px-2 py-1 text-xs text-text/50 hover:text-text disabled:opacity-30 transition">↓</button>
              </div>
              <button onClick={() => togglePublished(t)} className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition">
                {t.published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => openEdit(t)} className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition">
                Edit
              </button>
              <button onClick={() => deleteTestimonial(t)} className="text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-bg p-8 shadow-2xl my-auto">
            <h3 className="text-xl font-semibold text-text mb-6">{editing ? 'Edit Testimonial' : 'New Testimonial'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Author Name</label>
                <input required value={form.authorName} onChange={set('authorName')} placeholder="Jane Smith"
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Author Detail (optional)</label>
                <input value={form.authorDetail ?? ''} onChange={set('authorDetail')} placeholder="Painting Student, 2025"
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Quote</label>
                <textarea required rows={4} value={form.quote} onChange={set('quote')}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent resize-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-text/50">Photo (optional)</label>
                {form.photoUrl && (
                  <div className="relative inline-block">
                    <img src={form.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                    <button type="button"
                      onClick={() => setForm((f) => ({ ...f, photoUrl: null }))}
                      className="absolute -right-1 -top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white/80 transition hover:bg-black/80">
                      ✕
                    </button>
                  </div>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; uploadPhoto(f); } }} />
                <div>
                  <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                    className="text-xs text-accent/70 transition hover:text-accent disabled:opacity-40">
                    {photoUploading ? 'Uploading…' : form.photoUrl ? 'Replace photo' : '+ Upload photo'}
                  </button>
                  {photoError && <p className="text-xs text-red-400 mt-1">{photoError}</p>}
                </div>
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
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
