import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, normalizePaintings } from '../lib/api';
import type { Painting } from '../types';

interface BulkResult {
  created: number;
  skipped: string[];
  errors: { filename: string; error: string }[];
}

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
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

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

  const handleBulkUpload = async () => {
    if (!bulkFiles.length) return;
    setBulkUploading(true);
    setBulkResult(null);
    setBulkProgress({ current: 0, total: bulkFiles.length });

    const totals: BulkResult = { created: 0, skipped: [], errors: [] };

    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];
      const fd = new FormData();
      fd.append('files', file);
      try {
        const data = await apiFetch<BulkResult>('/api/uploads/bulk', { method: 'POST', body: fd });
        totals.created += data.created ?? 0;
        totals.skipped.push(...(data.skipped ?? []));
        totals.errors.push(...(data.errors ?? []));
      } catch (err) {
        totals.errors.push({ filename: file.name, error: String(err) });
      }
      setBulkProgress({ current: i + 1, total: bulkFiles.length });
    }

    setBulkResult({ ...totals });
    setBulkUploading(false);
    setBulkFiles([]);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    await loadPaintings();
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

      <div className="rounded-2xl border border-border bg-surface/80 p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text">Bulk Upload</h3>
          <p className="mt-1 text-sm text-text/70">Upload multiple images at once. Titles and slugs are auto-generated from filenames. Paintings whose derived title already exists are skipped.</p>
        </div>
        <input
          ref={bulkInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/tiff"
          onChange={(e) => { setBulkFiles(Array.from(e.target.files ?? [])); setBulkResult(null); setBulkProgress(null); }}
          disabled={bulkUploading}
          className="w-full text-sm text-text/80 file:mr-3 file:rounded-md file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
        />
        {bulkFiles.length > 0 && !bulkUploading && (
          <p className="text-sm text-text/70">{bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''} selected</p>
        )}
        <button
          type="button"
          onClick={handleBulkUpload}
          disabled={!bulkFiles.length || bulkUploading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {bulkUploading ? 'Uploading…' : 'Upload All'}
        </button>

        {bulkProgress && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-text/70">
              <span>Processing…</span>
              <span>{bulkProgress.current} / {bulkProgress.total}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${Math.round((bulkProgress.current / bulkProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {bulkResult && (
          <div className="rounded-xl border border-border bg-bg/90 p-4 text-sm space-y-2">
            <p className="text-text"><span className="font-semibold text-accent">{bulkResult.created}</span> painting{bulkResult.created !== 1 ? 's' : ''} created</p>
            {bulkResult.skipped.length > 0 && (
              <p className="text-text/60"><span className="font-semibold">{bulkResult.skipped.length}</span> skipped (duplicate): {bulkResult.skipped.join(', ')}</p>
            )}
            {bulkResult.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-red-400 font-semibold">{bulkResult.errors.length} failed:</p>
                <ul className="space-y-0.5 pl-2 text-red-400/80 text-xs">
                  {bulkResult.errors.slice(0, 15).map((e, i) => (
                    <li key={i}><span className="font-medium">{e.filename}</span>: {e.error}</li>
                  ))}
                  {bulkResult.errors.length > 15 && <li>…and {bulkResult.errors.length - 15} more</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

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
