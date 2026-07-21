import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import { getAccessToken } from '../../lib/apiFetch';

interface Slide {
  id: string;
  imageUrl: string;
  thumbUrl: string | null;
  caption: string | null;
  position: number;
}

interface Props {
  context: string;
}

export function SlideshowEditor({ context }: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const data = await apiFetch<Slide[]>(`/api/slides/${context}`);
      setSlides(data);
    } catch {}
  };

  useEffect(() => { load(); }, [context]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be picked again if needed
    e.target.value = '';
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getAccessToken();
      const uploadRes = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: 'include',
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }
      const { imageUrl, thumbUrl, fullResUrl } = await uploadRes.json();
      await apiFetch(`/api/slides/${context}`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl, thumbUrl, fullResUrl }),
      });
      await load();
    } catch (err) {
      setUploadError(String(err));
    } finally {
      setUploading(false);
    }
  };

  const updateCaption = async (id: string, caption: string) => {
    try {
      await apiFetch(`/api/slides/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ caption: caption || null }),
      });
    } catch {}
  };

  const move = async (id: string, direction: 'up' | 'down') => {
    try {
      await apiFetch(`/api/slides/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ direction }),
      });
      await load();
    } catch {}
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/slides/${id}`, { method: 'DELETE' });
      await load();
    } catch {}
  };

  return (
    <div className="space-y-3">
      {slides.length === 0 && !uploading && (
        <p className="text-xs text-text/40 italic">No slides yet — add an image below.</p>
      )}

      {slides.map((slide, i) => (
        <div key={slide.id} className="flex items-start gap-3 rounded-xl border border-border bg-bg/60 p-3">
          <img
            src={slide.thumbUrl ?? slide.imageUrl}
            alt=""
            className="h-14 w-20 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <input
              type="text"
              defaultValue={slide.caption ?? ''}
              onBlur={(e) => updateCaption(slide.id, e.target.value)}
              placeholder="Caption (optional)"
              className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              onClick={() => move(slide.id, 'up')}
              disabled={i === 0}
              className="rounded px-1.5 py-0.5 text-xs text-text/50 transition hover:text-accent disabled:opacity-20"
              title="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => move(slide.id, 'down')}
              disabled={i === slides.length - 1}
              className="rounded px-1.5 py-0.5 text-xs text-text/50 transition hover:text-accent disabled:opacity-20"
              title="Move down"
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => remove(slide.id)}
            className="shrink-0 rounded px-1.5 py-0.5 text-xs text-text/40 transition hover:text-red-400"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}

      {uploading && (
        <div className="rounded-xl border border-border bg-bg/60 px-4 py-3 text-xs text-text/50">
          Uploading…
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-400">{uploadError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-accent/70 transition hover:text-accent disabled:opacity-40"
      >
        + Add image
      </button>
    </div>
  );
}
