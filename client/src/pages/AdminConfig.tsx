import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken } from '../lib/apiFetch';
import { useSiteConfig, defaultConfig } from '../context/SiteConfigContext';
import { SlideshowEditor } from '../components/admin/SlideshowEditor';
import { SocialLinksEditor } from '../components/admin/SocialLinksEditor';
import type { SiteConfig } from '../context/SiteConfigContext';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ── Shared sub-components ────────────────────────────────────────────────────

function LabeledField({ label, value, onChange, onBlur, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-text/60">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function SettingRow({ label, description, checked, onChange, saving, children }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  saving?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-6 py-4">
        <div>
          <p className="text-sm font-medium text-text">{label}</p>
          <p className="mt-0.5 text-xs text-text/50">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={onChange}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-60 ${checked ? 'bg-accent' : 'bg-text/20'}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>
      {children && (
        <div className={`overflow-hidden transition-all duration-200 ${checked ? 'max-h-[600px] pb-4 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="ml-3 space-y-4 border-l-2 border-accent/25 pl-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function SubSetting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-text/60">{label}</p>
      {children}
    </div>
  );
}

function CollapsibleCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-surface/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/70">{title}</p>
        <span className={`select-none text-sm text-text/40 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}>
          ▾
        </span>
      </button>
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? 'max-h-[3000px]' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminConfig() {
  const { config, refresh } = useSiteConfig();
  const [local, setLocal] = useState<SiteConfig>(config);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal({
      ...config,
      commissionTitle: config.commissionTitle || defaultConfig.commissionTitle,
      commissionBody: config.commissionBody.length > 0 ? config.commissionBody : defaultConfig.commissionBody,
    });
  }, [config]);

  const save = async (patch: Partial<SiteConfig>) => {
    setSaveState('saving');
    try {
      await apiFetch('/api/config', { method: 'PATCH', body: JSON.stringify(patch) });
      await refresh();
      setSaveState('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  };

  const toggle = (key: keyof SiteConfig) => {
    if (typeof local[key] !== 'boolean') return;
    const next = !local[key] as boolean;
    setLocal((f) => ({ ...f, [key]: next }));
    save({ [key]: next });
  };

  const field = (key: keyof SiteConfig) => ({
    value: local[key] as string,
    onChange: (v: string) => setLocal((f) => ({ ...f, [key]: v })),
    onBlur: () => save({ [key]: local[key] }),
  });

  const updateBody = (i: number, value: string) => {
    setLocal((f) => {
      const next = [...f.commissionBody];
      next[i] = value;
      return { ...f, commissionBody: next };
    });
  };

  const removeBody = (i: number) => {
    const next = local.commissionBody.filter((_, idx) => idx !== i);
    setLocal((f) => ({ ...f, commissionBody: next }));
    save({ commissionBody: next });
  };

  const addBody = () => setLocal((f) => ({ ...f, commissionBody: [...f.commissionBody, ''] }));

  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const handleHeroChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setHeroUploading(true);
    setHeroError(null);
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
      await apiFetch('/api/config', {
        method: 'PATCH',
        body: JSON.stringify({ heroImageUrl: imageUrl, heroThumbUrl: thumbUrl, heroFullResUrl: fullResUrl }),
      });
      setLocal((f) => ({ ...f, heroImageUrl: imageUrl }));
      await refresh();
    } catch (err) {
      setHeroError(String(err));
    } finally {
      setHeroUploading(false);
    }
  };

  const removeHeroImage = async () => {
    try {
      await apiFetch('/api/config', {
        method: 'PATCH',
        body: JSON.stringify({ heroImageUrl: null, heroThumbUrl: null, heroFullResUrl: null }),
      });
      setLocal((f) => ({ ...f, heroImageUrl: null }));
      await refresh();
    } catch {}
  };

  const isSaving = saveState === 'saving';

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent/80">Admin</p>
          <h1 className="section-heading mt-2 text-3xl font-semibold text-text">Site Configuration</h1>
          <p className="mt-2 text-sm text-text/60">Changes take effect immediately on the public site.</p>
        </div>
        <p className={`text-xs transition ${isSaving ? 'text-text/50' : saveState === 'saved' ? 'text-success' : saveState === 'error' ? 'text-red-400' : 'text-transparent'}`}>
          {isSaving ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save failed' : 'Saved'}
        </p>
      </div>

      {/* Landing Page card */}
      <CollapsibleCard title="Landing Page">
        <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label="Gallery title" placeholder="Artist or gallery name" {...field('siteTitle')} />
            <div /> {/* spacer */}
            <LabeledField label="Primary tagline" placeholder="Bold statement about the work" {...field('taglinePrimary')} />
            <LabeledField label="Secondary tagline" placeholder="Subtitle or style description" {...field('taglineSecondary')} />
            <LabeledField label="Footer tagline" placeholder="Short description shown in the site footer" {...field('taglineFooter')} />
            <div /> {/* spacer */}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Social media</p>
            <p className="text-xs text-text/50">Paste any profile URL — the icon is detected automatically.</p>
            <SocialLinksEditor />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Hero background image</p>
            <p className="text-xs text-text/50">Background image for the landing page hero panel. Optional.</p>
            {local.heroImageUrl && (
              <div className="relative">
                <img src={local.heroImageUrl} alt="" className="h-24 w-full rounded-xl object-cover" />
                <button
                  onClick={removeHeroImage}
                  className="absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white/80 transition hover:bg-black/70"
                >
                  Remove
                </button>
              </div>
            )}
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
            <button
              onClick={() => heroInputRef.current?.click()}
              disabled={heroUploading}
              className="text-xs text-accent/70 transition hover:text-accent disabled:opacity-40"
            >
              {heroUploading ? 'Uploading…' : local.heroImageUrl ? 'Replace image' : '+ Upload image'}
            </button>
            {heroError && <p className="text-xs text-red-400">{heroError}</p>}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Slideshow</p>
            <p className="text-xs text-text/50">Images appear in the hero panel on the home page. Captions are optional.</p>
            <SlideshowEditor context="landing" />
          </div>
        </div>
      </CollapsibleCard>

      {/* Site Features card */}
      <CollapsibleCard title="Site Features">
        <div className="border-t border-border px-6">
        <SettingRow
          label="Commission requests"
          description="Show the commission inquiry form and nav link."
          checked={local.commissionsEnabled}
          onChange={() => toggle('commissionsEnabled')}
          saving={isSaving}
        >
          <div className="space-y-1">
            <p className="text-xs text-text/60">Page title</p>
            <input
              type="text"
              value={local.commissionTitle}
              onChange={(e) => setLocal((f) => ({ ...f, commissionTitle: e.target.value }))}
              onBlur={() => save({ commissionTitle: local.commissionTitle })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-text/60">Intro paragraphs</p>
            {local.commissionBody.map((para, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => updateBody(i, e.target.value)}
                  onBlur={() => save({ commissionBody: local.commissionBody })}
                  className="flex-1 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
                <button onClick={() => removeBody(i)} className="mt-1 text-xs text-text/40 transition hover:text-red-400">
                  Remove
                </button>
              </div>
            ))}
            <button onClick={addBody} className="text-xs text-accent/70 transition hover:text-accent">
              + Add paragraph
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-text/60">Slideshow</p>
            <p className="text-xs text-text/40">Images appear on the right side of the commission intro.</p>
            <SlideshowEditor context="commission" />
          </div>
        </SettingRow>

        <SettingRow
          label="Newsletter signup"
          description="Show the email signup form on the home page."
          checked={local.newsletterEnabled}
          onChange={() => toggle('newsletterEnabled')}
          saving={isSaving}
        />
        <SettingRow
          label="Events section"
          description="Show the Events page link in the navigation."
          checked={local.eventsEnabled}
          onChange={() => toggle('eventsEnabled')}
          saving={isSaving}
        />
        <SettingRow
          label="Featured works on home page"
          description="Show a Featured Works section on the home page."
          checked={local.featuredEnabled}
          onChange={() => toggle('featuredEnabled')}
          saving={isSaving}
        >
          <SubSetting label="Number of paintings to show">
            <input
              type="number"
              min={1}
              max={24}
              value={local.featuredCount}
              onChange={(e) => setLocal((f) => ({ ...f, featuredCount: Number(e.target.value) }))}
              onBlur={() => save({ featuredCount: local.featuredCount })}
              disabled={isSaving}
              className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-right text-sm text-text outline-none focus:border-accent disabled:opacity-40"
            />
          </SubSetting>
        </SettingRow>
        <SettingRow
          label="Show prices"
          description="Display prices on gallery cards and the painting detail view."
          checked={local.showPrice}
          onChange={() => toggle('showPrice')}
          saving={isSaving}
        />
        </div>
      </CollapsibleCard>

    </div>
  );
}
