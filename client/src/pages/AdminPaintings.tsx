declare const __BACKEND__: string;
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, normalizeWorks, getAccessToken } from '../lib/apiFetch';
import { galleryConfig } from '../config/gallery';
import type { BulkUploadResult, Work } from '../types';
import { WorkPhotoSection } from '../components/admin/WorkPhotoSection';

const MEDIA_TYPES = ['painting', 'photography', 'sculpture', 'drawing', 'printmaking', 'mixed_media', 'digital', 'other'];

function printTier(w?: number | null, h?: number | null): 'large' | 'medium' | 'small' | 'none' {
  if (!w || !h) return 'none';
  const s = Math.min(w, h);
  if (s >= 5000) return 'large';
  if (s >= 3000) return 'medium';
  if (s >= 1500) return 'small';
  return 'none';
}

const tierLabel: Record<string, string> = {
  large:  'Large format prints',
  medium: 'Medium prints',
  small:  'Small prints only',
  none:   'Web only',
};

function origFileType(url?: string | null): string {
  if (!url) return '';
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = { tif: 'TIFF', tiff: 'TIFF', jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', webp: 'WebP' };
  return map[ext] ?? ext.toUpperCase();
}

interface BulkUploadProps {
  bulkUploading: boolean;
  bulkProgress: { current: number; total: number } | null;
  bulkResult: BulkUploadResult | null;
  onUpload: (files: File[]) => void;
  onResetBulk: () => void;
  refreshSignal: number;
}

const defaultForm: Partial<Work> = {
  tags: [],
  status: 'Available',
  printsAvailable: false,
  featured: false,
  showInGallery: true,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function WorkCard({ work, onClick }: { work: Work; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg/90 text-left transition hover:border-accent"
    >
      {work.image || work.progressThumbUrl
        ? <img src={work.image || work.progressThumbUrl || ''} alt={work.title} className="aspect-square w-full object-cover" />
        : <div className="flex aspect-square w-full items-center justify-center bg-surface text-xs text-text/40">In Progress</div>
      }
      <div className="flex-1 p-3">
        <h3 className="truncate text-sm font-semibold text-text">{work.title || 'Untitled'}</h3>
        <p className="mt-1 truncate text-xs text-text/60">
          {[work.status, work.showInGallery === false ? 'Hidden' : null].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-1 text-xs text-text/70">
          {work.price != null ? `$${work.price.toLocaleString()}` : 'Price on request'}
        </p>
      </div>
    </button>
  );
}

export default function AdminPaintings({
  bulkUploading,
  bulkProgress,
  bulkResult,
  onUpload,
  onResetBulk,
  refreshSignal,
}: BulkUploadProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Work>>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadElapsed, setUploadElapsed] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [dimensionError, setDimensionError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<{ dimensions: string[]; mediums: string[]; subjects: string[] }>({ dimensions: [], mediums: [], subjects: [] });
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploading) { setUploadElapsed(0); return; }
    setUploadElapsed(0);
    const t = setInterval(() => setUploadElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [uploading]);

  const normalizeDimension = (v: string) =>
    v.trim()
      .replace(/(\d+(?:\.\d+)?)\s*(?:inches?|in|")/gi, '$1')
      .replace(/\s*[xX×]\s*/g, '×')
      .trim();
  const dimensionPattern = /^\d+(\.\d+)?×\d+(\.\d+)?$/;

  const loadWorks = async () => {
    try {
      const data = await apiFetch<unknown[]>('/api/works?includeInProgress=true&includeHidden=true');
      setWorks(normalizeWorks(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, [refreshSignal]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setDimensionError(false);
    setSaveError(null);
    setConfirmDeleteOpen(false);
    setIsAddModalOpen(false);
  };

  const openForm = async (work?: Work) => {
    if (work) {
      setForm({ ...work, tags: work.tags ?? [], price: work.price ?? undefined });
      setEditingId(work.id);
    } else {
      setForm(defaultForm);
      setEditingId(null);
    }
    try {
      const opts = await apiFetch<{ dimensions: string[]; mediums: string[]; subjects: string[] }>('/api/works/meta/options');
      setFieldOptions(opts);
    } catch {
      // non-fatal — datalists stay empty
    }
    setIsAddModalOpen(true);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    const token = getAccessToken();
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${__BACKEND__}/api/uploads/image`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const tier = printTier(data.originalWidth, data.originalHeight);
          setForm((f) => ({ ...f, image: data.imageUrl, fullResUrl: data.fullResUrl, thumbUrl: data.thumbUrl, originalWidth: data.originalWidth, originalHeight: data.originalHeight, printsAvailable: tier !== 'none' }));
        } catch {
          alert('Upload succeeded but response was unreadable.');
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          alert(`Upload failed (${xhr.status}): ${body.error ?? xhr.statusText}`);
        } catch {
          alert(`Upload failed: ${xhr.status} ${xhr.statusText}`);
        }
      }
      setUploading(false);
      setUploadProgress(null);
    };
    xhr.onerror = () => {
      alert('Upload failed — could not reach the server.');
      setUploading(false);
      setUploadProgress(null);
    };
    xhr.ontimeout = () => {
      alert('Upload timed out — server may still be processing. Check server logs.');
      setUploading(false);
      setUploadProgress(null);
    };
    xhr.send(fd);
  };

  const startBulkUpload = () => {
    if (!bulkFiles.length) return;
    const files = [...bulkFiles];
    setBulkFiles([]);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    setIsBulkModalOpen(false);
    onUpload(files);
  };

  const saveWork = async () => {
    setSaveError(null);
    const isInProgress = form.status === 'In Progress';
    if (!isInProgress && !form.title?.trim()) { setSaveError('Title is required.'); return; }
    if (!isInProgress && !editingId && !form.image) { setSaveError('Please upload an image before saving.'); return; }
    if (form.dimensions && !dimensionPattern.test(form.dimensions)) {
      setDimensionError(true);
      return;
    }
    // Omit slug when there's no title yet (a bare in-progress work) — the server
    // auto-generates a unique placeholder slug rather than every untitled work colliding
    // on the same client-computed "untitled" slug.
    const slug = form.slug || (form.title ? slugify(form.title) : undefined);
    const payload = {
      title: form.title || null,
      slug,
      status: form.status ?? 'AVAILABLE',
      subject: form.subject || null,
      mediaType: form.mediaType ?? null,
      tags: form.tags ?? [],
      year: form.year ?? null,
      dimensions: form.dimensions ?? null,
      medium: form.medium ?? null,
      price: form.price ?? null,
      originalWidth: form.originalWidth ?? null,
      originalHeight: form.originalHeight ?? null,
      imageUrl: form.image || null,
      fullResUrl: form.fullResUrl ?? form.image ?? null,
      thumbUrl: form.thumbUrl ?? form.image ?? null,
      printsAvailable: galleryConfig.printsAutoFromResolution
        ? printTier(form.originalWidth, form.originalHeight) !== 'none'
        : form.printsAvailable ?? false,
      featured: form.featured ?? false,
      showInGallery: form.showInGallery ?? true,
      description: form.description ?? null,
    };
    try {
      if (editingId) {
        await apiFetch<Work>(`/api/works/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        await loadWorks();
        resetForm();
      } else {
        const created = await apiFetch<Work>('/api/works', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        await loadWorks();
        if (isInProgress) {
          // Keep the modal open and switch into edit mode — the photo sections below
          // need a real work id to attach to, so closing here would force a second
          // click just to add the first photo.
          setForm((f) => ({ ...f, slug: created.slug }));
          setEditingId(created.id);
        } else {
          resetForm();
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const match = msg.match(/- (.+)$/s);
      let friendly = 'Save failed — please try again.';
      if (match) {
        try { friendly = (JSON.parse(match[1]) as { error?: string }).error ?? friendly; } catch { /* keep default */ }
      }
      setSaveError(friendly);
    }
  };

  const deleteWork = async (id: string) => {
    try {
      await apiFetch(`/api/works/${id}`, { method: 'DELETE' });
      setWorks((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (!editingId) return;
    await deleteWork(editingId);
    setConfirmDeleteOpen(false);
    resetForm();
  };

  // Grouped into three sections for quick access — In Progress, Featured, everything else.
  // Each work belongs to exactly one group (an in-progress work that's also flagged featured
  // stays in In Progress, since that's the more actionable place to find it). Within each
  // group the server's existing year-descending order is preserved — only the search filter
  // is applied here, no re-sort. Admin-only presentation choice; the public gallery
  // deliberately stays a flat year sort (see server orderBy).
  const groupedWorks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? works.filter((w) => (w.title || '').toLowerCase().includes(query))
      : works;
    const inProgress = filtered.filter((w) => w.status === 'In Progress');
    const featured = filtered.filter((w) => w.status !== 'In Progress' && w.featured);
    const rest = filtered.filter((w) => w.status !== 'In Progress' && !w.featured);
    return { inProgress, featured, rest };
  }, [works, search]);
  const displayCount = groupedWorks.inProgress.length + groupedWorks.featured.length + groupedWorks.rest.length;

  const formTags = useMemo(
    () => (Array.isArray(form.tags) ? form.tags.join(', ') : String(form.tags ?? '')),
    [form.tags],
  );

  const updateTags = (value: string) =>
    setForm((f) => ({ ...f, tags: value.split(',').map((t) => t.trim()).filter(Boolean) }));

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-heading text-2xl font-semibold text-text">Works</h2>
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
            Add Work
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative w-full max-w-sm">
        <input
          type="text"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border bg-bg/90 px-3 py-2 pr-9 text-sm text-text outline-none transition placeholder:text-text/40 focus:border-accent"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text/40 transition hover:text-text"
          >
            ✕
          </button>
        )}
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
      {/* Deliberately no backdrop-click-to-close — Cancel/Save (or the confirm-delete flow
          below) are the only ways out, so an accidental outside click can't silently drop
          in-progress edits or, worse, be mistaken for a delete confirmation. */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full rounded-2xl border border-border bg-bg shadow-xl ${editingId ? 'max-w-4xl' : 'max-w-3xl'}`}>
            <div className="max-h-[90vh] overflow-y-auto p-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">
                  {editingId ? 'Edit Work' : 'Add Work'}
                </h3>
                <button onClick={resetForm} className="text-text/50 transition hover:text-text">✕</button>
              </div>

              <div className="flex gap-5">
                {/* Left: image preview + pick button + image info */}
                <div className="flex w-40 shrink-0 flex-col items-center gap-2">
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
                    onClick={() => { if (imageInputRef.current) imageInputRef.current.value = ''; imageInputRef.current?.click(); }}
                    disabled={uploading}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-text/80 transition hover:border-accent hover:text-text disabled:opacity-50"
                  >
                    {uploading
                      ? (uploadProgress !== null && uploadProgress < 100
                          ? `Uploading ${uploadProgress}%`
                          : `Processing… ${uploadElapsed}s`)
                      : 'Choose image'}
                  </button>
                  {uploadProgress !== null && (
                    <div className="w-full overflow-hidden rounded-full bg-border" style={{ height: 4 }}>
                      <div
                        className={`h-full rounded-full bg-accent transition-all duration-150 ${uploadProgress === 100 ? 'animate-pulse' : ''}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Image metadata */}
                  {form.image && form.fullResUrl?.startsWith('http') && (
                    <div className="w-full space-y-1 border-t border-border pt-2 text-center">
                      {origFileType(form.fullResUrl) && (
                        <p className="text-xs font-medium text-text/70">{origFileType(form.fullResUrl)}</p>
                      )}
                      {form.originalWidth && form.originalHeight && (
                        <>
                          <p className="text-xs text-text/50">{form.originalWidth.toLocaleString()} × {form.originalHeight.toLocaleString()} px</p>
                          <p className={`text-xs font-medium ${printTier(form.originalWidth, form.originalHeight) === 'none' ? 'text-red-400' : 'text-accent/80'}`}>
                            {tierLabel[printTier(form.originalWidth, form.originalHeight)]}
                          </p>
                        </>
                      )}
                      {editingId && (
                        <a
                          href={`/api/works/${editingId}/download`}
                          className="block text-xs text-text/40 underline-offset-2 transition hover:text-accent hover:underline"
                        >
                          Download original
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: all form fields */}
                <div className="flex flex-1 flex-col gap-3">
                  <input
                    placeholder="Title of this work"
                    value={form.title ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-bg/90 px-4 py-2 text-text"
                  />

                  <textarea
                    placeholder="Description visible to visitors"
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-bg/90 px-4 py-2 text-text"
                  />

                  {/* Media type · Status · Year · Price */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Media type</label>
                      <select
                        value={form.mediaType ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value || null }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      >
                        <option value="">Not specified</option>
                        {MEDIA_TYPES.map((t) => (
                          <option key={t} value={t}>{t.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Status</label>
                      <select
                        value={form.status ?? 'Available'}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Work['status'] }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      >
                        <option value="Available">Available</option>
                        <option value="Sold">Sold</option>
                        <option value="Reserved">Reserved</option>
                        <option value="NFS">Not for sale</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Year</label>
                      <input
                        type="number"
                        placeholder="Year created"
                        min={1800} max={2100}
                        value={form.year ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Price ($)</label>
                      <input
                        type="number"
                        placeholder="Selling price"
                        min={0} step={1}
                        value={form.price ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
                        className="rounded-xl border border-border bg-bg/90 px-2 py-2 text-sm text-text"
                      />
                    </div>
                  </div>

                  {/* Subject · Dimensions · Medium · Tags */}
                  <datalist id="subject-options">
                    {fieldOptions.subjects.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <datalist id="dimension-options">
                    {fieldOptions.dimensions.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <datalist id="medium-options">
                    {fieldOptions.mediums.map((m) => <option key={m} value={m} />)}
                  </datalist>

                  {galleryConfig.showSubject && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Subject</label>
                      <input
                        list="subject-options"
                        placeholder="Subject or theme"
                        value={form.subject ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        className="rounded-xl border border-border bg-bg/90 px-3 py-2 text-sm text-text"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Size (in)</label>
                      <div className="flex flex-col gap-0.5">
                        <input
                          list="dimension-options"
                          placeholder="Width × height"
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
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Medium</label>
                      <input
                        list="medium-options"
                        placeholder="Medium or materials"
                        value={form.medium ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, medium: e.target.value }))}
                        className="rounded-xl border border-border bg-bg/90 px-3 py-2 text-sm text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-text/60">Tags</label>
                      <input
                        placeholder="Comma-separated tags"
                        value={formTags}
                        onChange={(e) => updateTags(e.target.value)}
                        className="rounded-xl border border-border bg-bg/90 px-3 py-2 text-sm text-text"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-6">
                      {!galleryConfig.printsAutoFromResolution && (
                        <label className="flex items-center gap-2 text-sm text-text/80">
                          <input type="checkbox" checked={!!form.printsAvailable} onChange={(e) => setForm((f) => ({ ...f, printsAvailable: e.target.checked }))} />
                          Prints available
                        </label>
                      )}
                      <label className="flex items-center gap-2 text-sm text-text/80">
                        <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                        Featured
                      </label>
                      <label className="flex items-center gap-2 text-sm text-text/80">
                        <input type="checkbox" checked={form.showInGallery !== false} onChange={(e) => setForm((f) => ({ ...f, showInGallery: e.target.checked }))} />
                        {form.status === 'In Progress' ? 'Show on landing page' : 'Show in public gallery'}
                      </label>
                    </div>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteOpen(true)}
                        className="rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                      >
                        Delete this work
                      </button>
                    )}
                  </div>

                  {editingId && (
                    <div className="flex flex-col gap-4">
                      <WorkPhotoSection workId={editingId} mode="progress" />
                      <WorkPhotoSection workId={editingId} mode="reference" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {saveError && <p className="mt-3 text-sm text-red-400">{saveError}</p>}
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="rounded-md border border-border px-4 py-2 text-sm text-text">Cancel</button>
                <button type="button" onClick={saveWork} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg">
                  {editingId ? 'Save Changes' : 'Add Work'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {/* Its own modal rather than window.confirm() — deleting a work isn't part of the
          normal workflow (a work stays in the gallery's history even once sold or retired),
          so it deserves a deliberate, styled confirmation rather than a generic browser
          dialog. No backdrop-click-to-close, same reasoning as the edit modal above. */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-bg p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-text">Delete this work?</h3>
            <p className="mt-2 text-sm text-text/70">
              This permanently removes the work and its images. A work isn't normally deleted —
              it's part of the gallery's history even after it's sold or retired; consider
              unchecking "Show in public gallery" instead if you just want it off the public
              site. This can't be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDeleteOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm text-text">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                Delete
              </button>
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

      {/* ── Works list ── */}
      {/* Cards are click-to-edit (no separate Edit button); delete lives inside the edit
          modal now, not on the card, since it's a rarer, more deliberate action. Grouped
          into In Progress / Featured / everything else for quick access. */}
      {loading ? (
        <p className="text-text/70">Loading works…</p>
      ) : works.length === 0 ? (
        <p className="text-text/60">No works yet. Add one or use Bulk Upload.</p>
      ) : displayCount === 0 ? (
        <p className="text-text/60">No works match "{search}".</p>
      ) : (
        <div className="space-y-8">
          {groupedWorks.inProgress.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text/50">Works in Progress</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {groupedWorks.inProgress.map((work) => (
                  <WorkCard key={work.id} work={work} onClick={() => openForm(work)} />
                ))}
              </div>
            </div>
          )}
          {groupedWorks.featured.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text/50">Featured</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {groupedWorks.featured.map((work) => (
                  <WorkCard key={work.id} work={work} onClick={() => openForm(work)} />
                ))}
              </div>
            </div>
          )}
          {groupedWorks.rest.length > 0 && (
            <div className="space-y-3">
              {(groupedWorks.inProgress.length > 0 || groupedWorks.featured.length > 0) && (
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text/50">Everything Else</h3>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {groupedWorks.rest.map((work) => (
                  <WorkCard key={work.id} work={work} onClick={() => openForm(work)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
