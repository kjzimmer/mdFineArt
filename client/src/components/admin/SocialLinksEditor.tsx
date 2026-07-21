import { useRef, useState } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { detectPlatform } from '../../config/socialPlatforms';
import type { SocialLink } from '../../context/SiteConfigContext';

export function SocialLinksEditor() {
  const { config, refresh } = useSiteConfig();
  const links = config.socialLinks;
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = async () => {
    const url = newUrl.trim();
    if (!url) return;
    setAdding(true);
    try {
      await apiFetch('/api/social', { method: 'POST', body: JSON.stringify({ url }) });
      setNewUrl('');
      await refresh();
    } finally {
      setAdding(false);
    }
  };

  const updateUrl = async (link: SocialLink, url: string) => {
    if (url === link.url) return;
    try {
      await apiFetch(`/api/social/${link.id}`, { method: 'PATCH', body: JSON.stringify({ url }) });
      await refresh();
    } catch {}
  };

  const move = async (id: string, direction: 'up' | 'down') => {
    try {
      await apiFetch(`/api/social/${id}/move`, { method: 'POST', body: JSON.stringify({ direction }) });
      await refresh();
    } catch {}
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/social/${id}`, { method: 'DELETE' });
      await refresh();
    } catch {}
  };

  return (
    <div className="space-y-2">
      {links.map((link, i) => {
        const platform = detectPlatform(link.url);
        return (
          <div key={link.id} className="flex items-center gap-2 rounded-xl border border-border bg-bg/60 px-3 py-2">
            <span style={{ color: platform.color }} className="shrink-0" title={platform.label}>
              {platform.icon}
            </span>
            <input
              type="url"
              defaultValue={link.url}
              onBlur={(e) => updateUrl(link, e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text/30 focus:underline focus:decoration-accent/40"
            />
            <div className="flex shrink-0 flex-col">
              <button onClick={() => move(link.id, 'up')} disabled={i === 0}
                className="px-1 text-xs text-text/40 transition hover:text-accent disabled:opacity-20" title="Move up">↑</button>
              <button onClick={() => move(link.id, 'down')} disabled={i === links.length - 1}
                className="px-1 text-xs text-text/40 transition hover:text-accent disabled:opacity-20" title="Move down">↓</button>
            </div>
            <button onClick={() => remove(link.id)}
              className="shrink-0 px-1 text-xs text-text/40 transition hover:text-red-400" title="Remove">✕</button>
          </div>
        );
      })}

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-bg/40 px-3 py-2">
        <span className="shrink-0 text-text/30">
          {newUrl ? (() => { const p = detectPlatform(newUrl); return <span style={{ color: p.color }}>{p.icon}</span>; })() : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text/20">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
            </svg>
          )}
        </span>
        <input
          ref={inputRef}
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Paste a profile URL and press Enter"
          disabled={adding}
          className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text/30 disabled:opacity-50"
        />
        {newUrl && (
          <button onClick={add} disabled={adding}
            className="shrink-0 text-xs text-accent/80 transition hover:text-accent disabled:opacity-50">
            {adding ? '…' : 'Add'}
          </button>
        )}
      </div>
    </div>
  );
}
