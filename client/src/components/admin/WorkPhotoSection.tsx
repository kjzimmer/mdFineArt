import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken } from '../../lib/apiFetch';
import type { DigitalAsset } from '../../types';
import MediaLightbox from '../shared/MediaLightbox';
import { LibraryAssetPicker } from './LibraryAssetPicker';

interface Props {
  workId: string;
  mode: 'progress' | 'reference';
}

// Shared by the work editor's Progress Photos and Reference Photos sections — the grid/upload/
// lightbox wiring is the same for both; only the delete behavior and the "pick from library"
// option differ. Progress photos are one-off captures (always a fresh upload, never reused);
// reference photos can be picked from the gallery-wide library or uploaded fresh here.
export function WorkPhotoSection({ workId, mode }: Props) {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const label = mode === 'progress' ? 'Progress Photos' : 'Reference Photos';

  const load = async () => {
    try {
      const data = await apiFetch<DigitalAsset[]>(`/api/library?workId=${workId}&role=${mode}`);
      setAssets(data);
    } catch {}
  };

  useEffect(() => { load(); }, [workId, mode]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      fd.append('workId', workId);
      fd.append('role', mode);
      const token = getAccessToken();
      const res = await fetch('/api/library/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload failed');
      await load();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const remove = async (asset: DigitalAsset) => {
    if (mode === 'progress') {
      // One-off, never reused — full delete rather than leaving a permanent orphan.
      if (!window.confirm('Delete this progress photo? This cannot be undone.')) return;
      await apiFetch(`/api/library/${asset.id}`, { method: 'DELETE' });
    } else {
      // Unlink only — the asset stays in the shared library for reuse on other works.
      if (!asset.linkageId) return;
      await apiFetch(`/api/library/${asset.id}/link/${asset.linkageId}`, { method: 'DELETE' });
    }
    await load();
  };

  return (
    <div className="rounded-xl border border-text/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text">{label}</h4>
        <div className="flex items-center gap-2">
          {mode === 'reference' && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-md bg-bg/20 px-3 py-1.5 text-xs text-text/80 hover:bg-bg/40 transition"
            >
              Pick from library
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accentHover transition disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {assets.length === 0 ? (
        <p className="text-xs text-text/50">No {label.toLowerCase()} yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {assets.map((asset, i) => (
            <div key={asset.id} className="group relative aspect-square overflow-hidden rounded-lg bg-black/20">
              <button type="button" onClick={() => setLightboxIndex(i)} className="h-full w-full">
                <img src={asset.thumbUrl} alt="" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(asset); }}
                aria-label="Delete photo"
                className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-black/75 text-sm text-white opacity-90 transition hover:bg-red-600 group-hover:flex"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          images={assets.map((a) => ({ url: a.imageUrl, caption: a.caption }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {pickerOpen && (
        <LibraryAssetPicker
          onClose={() => setPickerOpen(false)}
          onAttach={async (assetIds) => {
            await Promise.all(assetIds.map((id) =>
              apiFetch(`/api/library/${id}/link`, {
                method: 'POST',
                body: JSON.stringify({ workId, role: 'reference' }),
              })
            ));
            setPickerOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}
