import { useEffect, useMemo, useState } from 'react';
import { apiFetch, normalizePaintings } from '../lib/api';
import type { Painting } from '../types';

const defaultForm: Partial<Painting> = {
  tags: [],
  status: 'Available',
  subject: 'Landscape',
  printsAvailable: false,
  featured: false,
};

export default function AdminPaintings() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Painting>>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPaintings = async () => {
    try {
      const data = await apiFetch<unknown[]>('/api/paintings');
      setPaintings(normalizePaintings(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaintings();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setIsAdding(false);
  };

  const openForm = (painting?: Painting) => {
    if (painting) {
      setForm({
        ...painting,
        tags: painting.tags ?? [],
        price: painting.price ?? undefined,
      });
      setEditingId(painting.id);
      setIsAdding(true);
      return;
    }

    setForm(defaultForm);
    setEditingId(null);
    setIsAdding(true);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads/image', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      setForm((f) => ({ ...f, image: data.imageUrl, fullResUrl: data.fullResUrl, thumbUrl: data.thumbUrl }));
    } catch (err) {
      console.error(err);
      alert('Image upload failed. Check the server is running.');
    } finally {
      setUploading(false);
    }
  };

  const savePainting = async () => {
    const slug = form.slug || (form.title || 'untitled').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = {
      title: form.title,
      slug,
      status: form.status ?? 'AVAILABLE',
      subject: form.subject ?? 'Landscape',
      tags: form.tags ?? [],
      year: form.year ?? null,
      dimensions: form.dimensions ?? null,
      medium: form.medium ?? null,
      price: form.price ?? null,
      priceLabel: form.priceLabel ?? null,
      imageUrl: form.image,
      fullResUrl: form.fullResUrl ?? form.image,
      thumbUrl: form.thumbUrl ?? form.image,
      printsAvailable: form.printsAvailable ?? false,
      featured: form.featured ?? false,
      description: form.description ?? null,
    };

    try {
      if (editingId) {
        await apiFetch<Painting>(`/api/paintings/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await apiFetch<Painting>('/api/paintings', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await loadPaintings();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const deletePainting = async (id: string) => {
    if (!window.confirm('Delete this painting?')) return;
    try {
      await apiFetch(`/api/paintings/${id}`, { method: 'DELETE' });
      setPaintings((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const formTags = useMemo(() => {
    return Array.isArray(form.tags) ? form.tags.join(', ') : String(form.tags ?? '');
  }, [form.tags]);

  const updateTags = (value: string) => {
    setForm((current) => ({ ...current, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-heading text-2xl font-semibold text-text">Paintings Manager</h2>
        <button onClick={() => openForm()} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">Add Painting</button>
      </div>

      {isAdding && (
        <div className="rounded-2xl border border-border bg-surface/80 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input placeholder="Title" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Slug (optional)" value={form.slug ?? ''} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Subject" value={form.subject ?? ''} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Status" value={form.status ?? 'Available'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Painting['status'] }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Year" value={form.year ?? ''} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Dimensions" value={form.dimensions ?? ''} onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Medium" value={form.medium ?? ''} onChange={(e) => setForm((f) => ({ ...f, medium: e.target.value }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Price" value={form.price ?? ''} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Price label" value={form.priceLabel ?? ''} onChange={(e) => setForm((f) => ({ ...f, priceLabel: e.target.value }))} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
            <input placeholder="Tags (comma separated)" value={formTags} onChange={(e) => updateTags(e.target.value)} className="rounded-xl border border-border bg-bg/90 px-4 py-3 text-text col-span-full" />
            <label className="col-span-full flex items-center gap-3">
              <input type="checkbox" checked={!!form.printsAvailable} onChange={(e) => setForm((f) => ({ ...f, printsAvailable: e.target.checked }))} />
              <span className="text-text/80">Prints available</span>
            </label>
            <label className="col-span-full flex items-center gap-3">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              <span className="text-text/80">Featured</span>
            </label>
            <div className="col-span-full">
              <label className="text-sm text-text/80">Upload image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/tiff" onChange={(e) => handleFile(e.target.files?.[0])} className="mt-2 w-full" />
              {uploading && <p className="text-sm text-text/70">Uploading...</p>}
              {form.image && <img src={form.image} alt="preview" className="mt-3 max-h-40 object-contain" />}
            </div>
            <textarea placeholder="Description" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="col-span-full rounded-xl border border-border bg-bg/90 px-4 py-3 text-text" />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm text-text">Cancel</button>
            <button type="button" onClick={savePainting} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">Save Painting</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-text/70">Loading paintings…</p>
      ) : (
        <div className="grid gap-4">
          {paintings.map((painting) => (
            <div key={painting.id} className="flex flex-col gap-4 rounded-xl border border-border bg-bg/90 p-4 sm:flex-row sm:items-center">
              <img src={painting.image} alt={painting.title} className="h-24 w-full flex-none rounded-2xl object-cover sm:w-32" />
              <div className="flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text">{painting.title}</h3>
                    <p className="text-sm text-text/70">{painting.subject} · {painting.status}</p>
                  </div>
                  <p className="text-sm text-text/70">{painting.priceLabel ?? (painting.price ? `$${painting.price.toFixed(2)}` : 'Price on request')}</p>
                </div>
                <p className="mt-3 text-sm text-text/80">Tags: {painting.tags?.join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openForm(painting)} className="rounded-md border border-border px-3 py-2 text-sm text-text">Edit</button>
                <button type="button" onClick={() => deletePainting(painting.id)} className="rounded-md border border-red-500 px-3 py-2 text-sm text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
