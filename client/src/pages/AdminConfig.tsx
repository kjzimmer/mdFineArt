import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken } from '../lib/apiFetch';
import { useSiteConfig, defaultConfig } from '../context/SiteConfigContext';
import { SlideshowEditor } from '../components/admin/SlideshowEditor';
import { SocialLinksEditor } from '../components/admin/SocialLinksEditor';
import { StructuredListEditor } from '../components/admin/StructuredListEditor';
import type {
  SiteConfig, AboutShow, AboutAward, AboutMedia, AboutGallery, AboutMembership,
} from '../context/SiteConfigContext';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ── Shared sub-components ────────────────────────────────────────────────────

function LabeledField({ label, value, onChange, onBlur, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-text/60">{label}</p>
      <input
        type={type}
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
        <div className={`overflow-hidden transition-all duration-200 ${checked ? 'max-h-[800px] pb-4 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
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
  const [open, setOpen] = useState(false);
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
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? 'max-h-[6000px]' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  hint,
  imageUrl,
  uploading,
  error,
  onUpload,
  onRemove,
}: {
  label: string;
  hint?: string;
  imageUrl: string | null;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-text/40">{label}</p>
      {hint && <p className="text-xs text-text/50">{hint}</p>}
      {imageUrl && (
        <div className="relative">
          <img src={imageUrl} alt="" className="h-48 w-48 rounded-xl object-cover" />
          <button
            onClick={onRemove}
            className="absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white/80 transition hover:bg-black/70"
          >
            Remove
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { e.target.value = ''; onUpload(file); }
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-accent/70 transition hover:text-accent disabled:opacity-40"
      >
        {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : '+ Upload image'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminConfig() {
  const { config, refresh } = useSiteConfig();
  const [local, setLocal] = useState<SiteConfig>(config);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image upload states
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [statImg1Uploading, setStatImg1Uploading] = useState(false);
  const [statImg1Error, setStatImg1Error] = useState<string | null>(null);
  const [studioUploading, setStudioUploading] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);

  useEffect(() => {
    setLocal({
      ...config,
      commissionTitle: config.commissionTitle || defaultConfig.commissionTitle,
      commissionBody: config.commissionBody.length > 0 ? config.commissionBody : defaultConfig.commissionBody,
      newsletterTitle: config.newsletterTitle || defaultConfig.newsletterTitle,
      newsletterTagline: config.newsletterTagline || defaultConfig.newsletterTagline,
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
    value: (local[key] as string) ?? '',
    onChange: (v: string) => setLocal((f) => ({ ...f, [key]: v })),
    onBlur: () => save({ [key]: local[key] }),
  });

  // Commission body helpers
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

  // About bio / statement helpers
  const updateParagraphs = (key: 'contactBody' | 'aboutBio' | 'aboutStatement', i: number, value: string) => {
    setLocal((f) => {
      const next = [...f[key]];
      next[i] = value;
      return { ...f, [key]: next };
    });
  };
  const removeParagraph = (key: 'contactBody' | 'aboutBio' | 'aboutStatement', i: number) => {
    const next = local[key].filter((_, idx) => idx !== i);
    setLocal((f) => ({ ...f, [key]: next }));
    save({ [key]: next });
  };
  const addParagraph = (key: 'contactBody' | 'aboutBio' | 'aboutStatement') =>
    setLocal((f) => ({ ...f, [key]: [...f[key], ''] }));

  // Generic image upload helper
  const uploadImage = async (
    file: File,
    setUploading: (v: boolean) => void,
    setError: (v: string | null) => void,
    onSuccess: (urls: { imageUrl: string; thumbUrl: string; fullResUrl: string }) => void,
  ) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getAccessToken();
      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }
      onSuccess(await res.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
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

      {/* ── Site Info card ─────────────────────────────────────────────────── */}
      <CollapsibleCard title="Site Info">
        <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label="Gallery title" placeholder="Artist or gallery name" {...field('siteTitle')} />
            <LabeledField label="Artist name" placeholder="Artist name shown on the About page" {...field('aboutName')} />
            <LabeledField label="Footer tagline" placeholder="Short description shown in the site footer" {...field('taglineFooter')} />
          </div>
        </div>
      </CollapsibleCard>

      {/* ── In Development card ────────────────────────────────────────────── */}
      <CollapsibleCard title="In Development">
        <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">
          <p className="text-xs text-text/40">These settings are reserved for features currently under development. Fields are saved but not yet fully wired to the UI.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label="Contact email" placeholder="hello@yourdomain.com" type="email" {...field('contactEmail')} />
            <LabeledField label="Contact phone" placeholder="+1 (555) 000-0000" {...field('contactPhone')} />
            <LabeledField label="Studio location" placeholder="Westcliffe, Colorado" {...field('studioLocation')} />
            <LabeledField label="Timezone" placeholder="America/Denver" {...field('timezone')} />
          </div>
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">SEO &amp; Discoverability</p>
            <LabeledField label="Meta description" placeholder="Short description for search engines" {...field('metaDescription')} />
            <LabeledField label="Open Graph image URL" placeholder="R2 URL for social share preview image" {...field('ogImageUrl')} />
          </div>
        </div>
      </CollapsibleCard>

      {/* ── Contact card ───────────────────────────────────────────────────── */}
      <CollapsibleCard title="Contact Us Form">
        <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">
          <LabeledField label="Heading" placeholder="Main heading for the contact section" {...field('contactHeading')} />

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Body paragraphs</p>
            <p className="text-xs text-text/50">Text shown below the heading, above the contact form.</p>
            {local.contactBody.map((para, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={2}
                  value={para}
                  onChange={(e) => updateParagraphs('contactBody', i, e.target.value)}
                  onBlur={() => save({ contactBody: local.contactBody })}
                  className="flex-1 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
                <button onClick={() => removeParagraph('contactBody', i)} className="mt-1 shrink-0 text-xs text-text/40 transition hover:text-red-400">
                  Remove
                </button>
              </div>
            ))}
            <button onClick={() => addParagraph('contactBody')} className="text-xs text-accent/70 transition hover:text-accent">
              + Add paragraph
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <ImageUploadField
              label="Contact photo"
              hint="Photo shown beside the contact form."
              imageUrl={local.studioImageUrl || null}
              uploading={studioUploading}
              error={studioError}
              onUpload={(file) =>
                uploadImage(file, setStudioUploading, setStudioError, ({ imageUrl }) => {
                  setLocal((f) => ({ ...f, studioImageUrl: imageUrl }));
                  save({ studioImageUrl: imageUrl });
                })
              }
              onRemove={() => {
                setLocal((f) => ({ ...f, studioImageUrl: '' }));
                save({ studioImageUrl: '' });
              }}
            />
            <LabeledField label="Photo caption" placeholder="e.g. Studio in Westcliffe, Colorado" {...field('contactImageCaption')} />
          </div>
        </div>
      </CollapsibleCard>

      {/* ── Landing Page card ──────────────────────────────────────────────── */}
      <CollapsibleCard title="Landing Page">
        <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label="Primary tagline" placeholder="Bold statement about the work" {...field('taglinePrimary')} />
            <LabeledField label="Secondary tagline" placeholder="Subtitle or style description" {...field('taglineSecondary')} />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Social media</p>
            <p className="text-xs text-text/50">Paste any profile URL — the icon is detected automatically.</p>
            <SocialLinksEditor />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <ImageUploadField
              label="Hero background image"
              hint="Background image for the landing page hero panel. Optional."
              imageUrl={local.heroImageUrl}
              uploading={heroUploading}
              error={heroError}
              onUpload={(file) =>
                uploadImage(file, setHeroUploading, setHeroError, async ({ imageUrl, thumbUrl, fullResUrl }) => {
                  await apiFetch('/api/config', {
                    method: 'PATCH',
                    body: JSON.stringify({ heroImageUrl: imageUrl, heroThumbUrl: thumbUrl, heroFullResUrl: fullResUrl }),
                  });
                  setLocal((f) => ({ ...f, heroImageUrl: imageUrl }));
                  await refresh();
                })
              }
              onRemove={async () => {
                await apiFetch('/api/config', {
                  method: 'PATCH',
                  body: JSON.stringify({ heroImageUrl: null, heroThumbUrl: null, heroFullResUrl: null }),
                });
                setLocal((f) => ({ ...f, heroImageUrl: null }));
                await refresh();
              }}
            />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Slideshow</p>
            <p className="text-xs text-text/50">Images appear in the hero panel on the home page. Captions are optional.</p>
            <SlideshowEditor context="landing" />
          </div>

          <div className="border-t border-border pt-4">
            <SettingRow
              label="Featured works"
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
          </div>
        </div>
      </CollapsibleCard>

      {/* ── About Page card ────────────────────────────────────────────────── */}
      <CollapsibleCard title="About Page">
        <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">

          {/* Bio paragraphs */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Artist bio</p>
            <LabeledField label="Bio subtitle" placeholder="Subtitle shown under the Artist Bio heading" {...field('aboutBioSubtitle')} />
            <p className="text-xs text-text/50">Main artist bio paragraphs shown in the top section.</p>
            {local.aboutBio.map((para, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => updateParagraphs('aboutBio', i, e.target.value)}
                  onBlur={() => save({ aboutBio: local.aboutBio })}
                  className="flex-1 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
                <button onClick={() => removeParagraph('aboutBio', i)} className="mt-1 shrink-0 text-xs text-text/40 transition hover:text-red-400">
                  Remove
                </button>
              </div>
            ))}
            <button onClick={() => addParagraph('aboutBio')} className="text-xs text-accent/70 transition hover:text-accent">
              + Add paragraph
            </button>
          </div>

          {/* Artist portrait */}
          <div className="space-y-3 border-t border-border pt-4">
            <ImageUploadField
              label="Artist portrait"
              hint="Photo shown in the bio section."
              imageUrl={local.profileImageUrl}
              uploading={profileUploading}
              error={profileError}
              onUpload={(file) =>
                uploadImage(file, setProfileUploading, setProfileError, ({ imageUrl, thumbUrl, fullResUrl }) => {
                  setLocal((f) => ({ ...f, profileImageUrl: imageUrl }));
                  save({ profileImageUrl: imageUrl, profileThumbUrl: thumbUrl, profileFullResUrl: fullResUrl });
                })
              }
              onRemove={() => {
                setLocal((f) => ({ ...f, profileImageUrl: null }));
                save({ profileImageUrl: null, profileThumbUrl: null, profileFullResUrl: null });
              }}
            />
          </div>

          {/* Memberships */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Professional memberships</p>
            <p className="text-xs text-text/50">Name, membership level, and optional logo URL for each org.</p>
            <StructuredListEditor<AboutMembership>
              items={local.aboutMemberships}
              fields={[
                { key: 'name', label: 'Organization', placeholder: 'Organization', flex: 3 },
                { key: 'level', label: 'Level', placeholder: 'Membership level', flex: 2 },
                { key: 'logoUrl', label: 'Logo URL', placeholder: 'Logo URL', flex: 2 },
                { key: 'url', label: 'Org URL', placeholder: 'Org URL', flex: 2 },
              ]}
              defaultItem={{ name: '', level: '', logoUrl: '', url: '' }}
              onChange={(items) => setLocal((f) => ({ ...f, aboutMemberships: items }))}
              onSave={(items) => save({ aboutMemberships: items })}
              addLabel="+ Add membership"
            />
          </div>

          {/* Artist statement */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Artist statement</p>
            <LabeledField label="Statement subtitle" placeholder="Subtitle shown under the Artist Statement heading" {...field('aboutStatSubtitle')} />
            <p className="text-xs text-text/50">Statement paragraphs shown in the section body.</p>
            {local.aboutStatement.map((para, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => updateParagraphs('aboutStatement', i, e.target.value)}
                  onBlur={() => save({ aboutStatement: local.aboutStatement })}
                  className="flex-1 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
                <button onClick={() => removeParagraph('aboutStatement', i)} className="mt-1 shrink-0 text-xs text-text/40 transition hover:text-red-400">
                  Remove
                </button>
              </div>
            ))}
            <button onClick={() => addParagraph('aboutStatement')} className="text-xs text-accent/70 transition hover:text-accent">
              + Add paragraph
            </button>
          </div>

          {/* Statement image */}
          <div className="space-y-3 border-t border-border pt-4">
            <ImageUploadField
              label="Statement image"
              hint="Photo shown alongside the artist statement paragraphs."
              imageUrl={local.aboutStatImage1Url}
              uploading={statImg1Uploading}
              error={statImg1Error}
              onUpload={(file) =>
                uploadImage(file, setStatImg1Uploading, setStatImg1Error, ({ imageUrl }) => {
                  setLocal((f) => ({ ...f, aboutStatImage1Url: imageUrl }));
                  save({ aboutStatImage1Url: imageUrl });
                })
              }
              onRemove={() => {
                setLocal((f) => ({ ...f, aboutStatImage1Url: null }));
                save({ aboutStatImage1Url: null });
              }}
            />
          </div>

          {/* Shows */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Shows &amp; exhibitions</p>
            <StructuredListEditor<AboutShow>
              items={local.aboutShows}
              fields={[
                { key: 'year', label: 'Year', placeholder: 'Year', type: 'number', flex: 0.6 },
                { key: 'name', label: 'Show name', placeholder: 'Show name', flex: 3 },
                { key: 'location', label: 'Location', placeholder: 'Location', flex: 2 },
              ]}
              defaultItem={{ year: new Date().getFullYear(), name: '', location: '' }}
              onChange={(items) => setLocal((f) => ({ ...f, aboutShows: items }))}
              onSave={(items) => save({ aboutShows: items })}
              addLabel="+ Add show"
            />
          </div>

          {/* Awards */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Awards &amp; recognition</p>
            <StructuredListEditor<AboutAward>
              items={local.aboutAwards}
              fields={[
                { key: 'year', label: 'Year', placeholder: 'Year', type: 'number', flex: 0.6 },
                { key: 'award', label: 'Award', placeholder: 'Award', flex: 2 },
                { key: 'event', label: 'Event', placeholder: 'Event', flex: 2 },
                { key: 'location', label: 'Location', placeholder: 'Location', flex: 1.5 },
              ]}
              defaultItem={{ year: new Date().getFullYear(), award: '', event: '', location: '' }}
              onChange={(items) => setLocal((f) => ({ ...f, aboutAwards: items }))}
              onSave={(items) => save({ aboutAwards: items })}
              addLabel="+ Add award"
            />
          </div>

          {/* Media */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Media mentions</p>
            <StructuredListEditor<AboutMedia>
              items={local.aboutMedia}
              fields={[
                { key: 'year', label: 'Year', placeholder: 'Year', type: 'number', flex: 0.6 },
                { key: 'title', label: 'Publication / feature', placeholder: 'Publication / feature', flex: 4 },
              ]}
              defaultItem={{ year: new Date().getFullYear(), title: '' }}
              onChange={(items) => setLocal((f) => ({ ...f, aboutMedia: items }))}
              onSave={(items) => save({ aboutMedia: items })}
              addLabel="+ Add mention"
            />
          </div>

          {/* Past galleries */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-text/40">Past gallery representation</p>
            <StructuredListEditor<AboutGallery>
              items={local.aboutGalleries}
              fields={[
                { key: 'year', label: 'Year', placeholder: 'Year', type: 'number', flex: 0.6 },
                { key: 'name', label: 'Gallery name', placeholder: 'Gallery name', flex: 3 },
                { key: 'location', label: 'Location', placeholder: 'Location', flex: 2 },
              ]}
              defaultItem={{ year: new Date().getFullYear(), name: '', location: '' }}
              onChange={(items) => setLocal((f) => ({ ...f, aboutGalleries: items }))}
              onSave={(items) => save({ aboutGalleries: items })}
              addLabel="+ Add gallery"
            />
          </div>

        </div>
      </CollapsibleCard>

      {/* ── Site Features card ─────────────────────────────────────────────── */}
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
          >
            <LabeledField
              label="Section heading"
              placeholder={defaultConfig.newsletterTitle}
              {...field('newsletterTitle')}
            />
            <LabeledField
              label="Description"
              placeholder={defaultConfig.newsletterTagline}
              {...field('newsletterTagline')}
            />
          </SettingRow>

          <SettingRow
            label="Events"
            description="Show the Events page link in the navigation."
            checked={local.eventsEnabled}
            onChange={() => toggle('eventsEnabled')}
            saving={isSaving}
          />

          <SettingRow
            label="Music"
            description="Show the Music page link in the navigation."
            checked={local.musicEnabled}
            onChange={() => toggle('musicEnabled')}
            saving={isSaving}
          />

          <SettingRow
            label="Classes"
            description="Show the Classes page link in the navigation."
            checked={local.classesEnabled}
            onChange={() => toggle('classesEnabled')}
            saving={isSaving}
          />

          <SettingRow
            label="Blog"
            description="Show the Blog page link in the navigation."
            checked={local.blogEnabled}
            onChange={() => toggle('blogEnabled')}
            saving={isSaving}
          />

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
