import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import type { DigitalAsset } from '../../types';

interface Props {
  onClose: () => void;
  onAttach: (assetIds: string[]) => Promise<void>;
}

// Gallery-wide multi-select grid, used from WorkPhotoSection in reference mode to attach
// existing library assets to a work without re-uploading.
export function LibraryAssetPicker({ onClose, onAttach }: Props) {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    apiFetch<DigitalAsset[]>('/api/library').then(setAssets).catch(() => {});
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col gap-4 rounded-2xl bg-bg p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Pick from Reference Library</h3>
          <button onClick={onClose} className="rounded-full bg-bg/20 px-3 py-1.5 text-sm text-text/80 hover:bg-bg/40 transition">Close</button>
        </div>

        {assets.length === 0 ? (
          <p className="text-sm text-text/50">Library is empty. Upload a photo instead.</p>
        ) : (
          <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {assets.map((asset) => {
              const isSelected = selected.has(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggle(asset.id)}
                  className={`aspect-square overflow-hidden rounded-lg ring-2 transition ${isSelected ? 'ring-accent' : 'ring-transparent'}`}
                >
                  <img src={asset.thumbUrl} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={selected.size === 0 || attaching}
          onClick={async () => {
            setAttaching(true);
            await onAttach(Array.from(selected));
            setAttaching(false);
          }}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
        >
          {attaching ? 'Attaching…' : `Attach ${selected.size || ''} selected`.trim()}
        </button>
      </div>
    </div>
  );
}
