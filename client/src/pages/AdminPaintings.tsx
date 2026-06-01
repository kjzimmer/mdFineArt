import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, normalizePaintings } from '../lib/api';
import type { BulkUploadResult, Painting } from '../types';

interface BulkUploadProps {
  bulkUploading: boolean;
  bulkProgress: { current: number; total: number } | null;
  bulkResult: BulkUploadResult | null;
  onUpload: (files: File[]) => void;
  onResetBulk: () => void;
  refreshSignal: number;
}

const defaultForm: Partial<Painting> = {
  tags: [],
  status: 'Available',
  subject: 'Landscape',
  printsAvailable: false,
  featured: false,
};

export default function AdminPaintings({
  bulkUploading,
  bulkProgress,
  bulkResult,
  onUpload,
  onResetBulk,
  refreshSignal,
}: BulkUploadProps) {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Painting>>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [dimensionError, setDimensionError] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const normalizeDimension = (v: string) => v.trim().replace(/\s*[xX]\s*/g, '×');
  const dimensionPattern = /^\d+(\.\d+)?×\d+(\.\d+)?$/;

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
  }, [refreshSignal]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setDimensionError(false);
    setIsAddModalOpen(false);
  };

  const openForm = (painting?: Painting) => {
    if (painting) {
      setForm({ ...painting, tags: painting.tags ?? [], price: painting.price ?? undefined });
      setEditingId(painting.id);
    } else {
      setForm(defaultForm);
      setEditingId(null);
    }
    setIsAddModalOpen(true);
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

  const startBulkUpload = () => {
    if (!bulkFiles.length) return;
    const files = [...bulkFiles];
    setBulkFiles([]);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    setIsBulkModalOpen(false);
    onUpload(files);
  };

  const savePainting = async () => {
    if (form.dimensions && !dimensionPattern.test(form.dimensions)) {
      setDimensionError(true);
      return;
    }
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

  const formTags = useMemo(
    () => (Array.isArray(form.tags) ? form.tags.join(', ') : String(form.tags ?? '')),
    [form.tags],
  );

  const dimensionOptions = useMemo(
    () => [...new Set(paintings.map((p) => p.dimensions).filter(Boolean))].sort() as string[],
    [paintings],
  );

  const mediumOptions = useMemo(
    () => [...new Set(paintings.map((p) => p.medium).filter(Boolean))].sort() as string[],
    [paintings],
  );

  const updateTags = (value: string) =>
    setForm((f) => ({ ...f, tags: value.split(',').map((t) => t.trim()).filter(Boolean) }));

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-heading text-2xl font-semibold text-text">Paintings</h2>
        <div className="flex flex-wrap items-center gap-3">
          {bulkUploading ? (
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="tabular-nums text-sm text-accent/80">
                {bulkProgress?.current ?? 0}/{bulkProgress?.total ?? 0} uploading…
              </span>
            </div>
          ) : bulkResult ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-accent">{bulkResult.created} created</span>
              {bulkResult.skipped.length > 0 && (
                <span className="text-text/60">{bulkResult.skipped.length} skipped</span>
              )}
              {bulkResult.errors.length > 0 && (
                <span className="text-red-400">{bulkResult.errors.length} failed</span>
              )}
              <button onClick={onResetBulk} className="ml-1 text-text/40 transition hover:text-text" aria-label="Dismiss">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text/80 transition hover:border-accent hover:text-text"
            >
              Bulk Upload
            </button>
          )}
          <button
            onClick={() => openForm()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg"
          >
            Add Painting
          </button>
        </div>
      </div>

      {/* ── Bulk error detail ── */}
      {bulkResult && bulkResult.errors.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm space-y-1">
          <p className="font-semibold text-red-400">
            {bulkResult.errors.length} file{bulkResult.errors.length !== 1 ? 's' : ''} failed:
          </p>
          <ul className="space-y-0.5 pl-2 text-xs text-red-400/80">
            {bulkResult.errors.slice(0, 15).map((e, i) => (
              <li key={i}><span className="font-medium">{e.filename}</span>: {e.error}</li>
            ))}
            {bulkResult.errors.length > 15 && <li>…and {bulkResult.errors.length - 15} more</li>}
          </ul>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-bg shadow-xl">
            <div className="p-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">
                  {editingId ? 'Edit Painting' : 'Add Painting'}
                </h3>
                <button onClick={resetForm} className="text-text/50 transition hover:text-text">✕</button>
              </div>

              <div className="flex gap-5">
                {/* Left: image preview + pick button */}
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
                    {form.image
                      ? <img src={form.image} alt="preview" className="h-full w-full object-cover" />
                      : <span className="text-xs text-text/40">No image</span>
                    }
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/tiff"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-text/80 transition hover:border-accent hover:text-text disabled:opacity-50"
                  >
                    {uploading ? 'Uploading…' : 'Choose image'}
                  </button>
                </div>

                {/* Right: all form fields */}
                <div className="flex flex-1 flex-col gap-3">
                  <input
                    placeholder="Title"
                    value={form.title ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-bg/90 px-4 py-2 text-text"
                  />

                  <textarea
                    placeholder="Description"
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-bg/90 px-4 py-2 text-text"
                  />

                  {/* Subject · Status · Year · Price */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Subject</label>
                      <select
                        value={form.subject ?? 'Landscape'}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      >
                        <option>Landscape</option>
                        <option>Equine</option>
                        <option>Mustangs</option>
                        <option>Wildlife</option>
                        <option>Portrait</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Status</label>
                      <select
                        value={form.status ?? 'Available'}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Painting['status'] }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      >
                        <option value="Available">Available</option>
                        <option value="Sold">Sold</option>
                        <option value="Reserved">Reserved</option>
                        <option value="NFS">Not for sale</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Year</label>
                      <input
                        type="number"
                        placeholder="2024"
                        min={1900} max={2100}
                        value={form.year ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Price ($)</label>
                      <input
                        type="number"
                        placeholder="2400"
                        min={0} step={1}
                        value={form.price ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      />
                    </div>
                  </div>

                  {/* Dimensions · Medium · Tags */}
                  <datalist id="dimension-options">
                    {dimensionOptions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <datalist id="medium-options">
                    {mediumOptions.map((m) => <option key={m} value={m} />)}
                  </datalist>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <input
                        list="dimension-options"
                        placeholder="e.g. 24×36"
                        value={form.dimensions ?? ''}
                        onChange={(e) => { setForm((f) => ({ ...f, dimensions: e.target.value })); setDimensionError(false); }}
                        onBlur={(e) => {
                          const v = normalizeDimension(e.target.value);
                          setForm((f) => ({ ...f, dimensions: v }));
                          if (v && !dimensionPattern.test(v)) setDimensionError(true);
                        }}
                        className={`rounded-xl border bg-bg/90 px-3 py-2 text-sm text-text ${dimensionError ? 'border-red-500' : 'border-border'}`}
                      />
                      {dimensionError && <span className="text-xs text-red-400">Format: 24×36</span>}
                    </div>
                    <input
                      list="medium-options"
                      placeholder="Medium"
                      value={form.medium ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, medium: e.target.value }))}
                      className="rounded-xl border border-border bg-bg/90 px-3 py-2 text-sm text-text"
                    />
                    <input
                      placeholder="Tags (comma separated)"
                      value={formTags}
                      onChange={(e) => updateTags(e.target.value)}
                      className="rounded-xl border border-border bg-bg/90 px-3 py-2 text-sm text-text"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-text/80">
                      <input type="checkbox" checked={!!form.printsAvailable} onChange={(e) => setForm((f) => ({ ...f, printsAvailable: e.target.checked }))} />
                      Prints available
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text/80">
                      <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                      Featured
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm text-text">Cancel</button>
                <button type="button" onClick={savePainting} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">
                  {editingId ? 'Save Changes' : 'Add Painting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload modal ── */}
      {isBulkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsBulkModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-bg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Bulk Upload</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-text/50 transition hover:text-text">✕</button>
            </div>
            <p className="text-sm text-text/70 leading-6">
              Select multiple images. Titles and slugs are auto-generated from filenames. Existing titles are skipped automatically.
              TIFFs must be flattened — use <span className="text-text/90">Image → Flatten Image</span> in Photoshop before saving.
            </p>
            <input
              ref={bulkInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/tiff"
              onChange={(e) => { setBulkFiles(Array.from(e.target.files ?? [])); onResetBulk(); }}
              className="w-full text-sm text-text/80 file:mr-3 file:rounded-md file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
            />
            {bulkFiles.length > 0 && (
              <p className="text-sm text-text/70">
                {bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''} selected
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsBulkModalOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm text-text">Cancel</button>
              <button
                onClick={startBulkUpload}
                disabled={!bulkFiles.length}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
              >
                Upload {bulkFiles.length > 0 ? `${bulkFiles.length} file${bulkFiles.length !== 1 ? 's' : ''}` : 'Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paintings list ── */}
      {loading ? (
        <p className="text-text/70">Loading paintings…</p>
      ) : paintings.length === 0 ? (
        <p className="text-text/60">No paintings yet. Add one or use Bulk Upload.</p>
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
                  <p className="text-sm text-text/70">
                    {painting.priceLabel ?? (painting.price ? `$${painting.price.toFixed(2)}` : 'Price on request')}
                  </p>
                </div>
                <p className="mt-2 text-sm text-text/60">Tags: {painting.tags?.join(', ')}</p>
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
