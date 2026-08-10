import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken } from '../lib/apiFetch';
import type { DigitalAsset } from '../types';
import MediaLightbox from '../components/shared/MediaLightbox';

export default function AdminReferenceLibrary() {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const data = await apiFetch<DigitalAsset[]>('/api/library');
      setAssets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
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
    const detail = await apiFetch<DigitalAsset>(`/api/library/${asset.id}`);
    const usedIn = detail.linkages?.length ?? 0;
    const message = usedIn > 0
      ? `This photo is used in ${usedIn} work${usedIn === 1 ? '' : 's'}. Deleting it removes it from all of them. Continue?`
      : 'Delete this photo from the library?';
    if (!window.confirm(message)) return;
    await apiFetch(`/api/library/${asset.id}`, { method: 'DELETE' });
    setLightboxIndex(null);
    await load();
  };

  if (loading) return <p className="text-text/60">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">Reference Library</h2>
          <p className="mt-1 text-sm text-text/60">
            Reusable reference photos — attach them to any work-in-progress from its editor.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload photos'}
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {assets.length === 0 ? (
        <p className="text-sm text-text/50">No reference photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset, i) => (
            <div key={asset.id} className="group relative aspect-square overflow-hidden rounded-lg bg-black/20">
              <button type="button" onClick={() => setLightboxIndex(i)} className="h-full w-full">
                <img src={asset.thumbUrl} alt="" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(asset); }}
                aria-label="Delete photo"
                className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-black/75 text-sm text-white opacity-90 transition hover:bg-red-600 group-hover:flex"
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
    </div>
  );
}
