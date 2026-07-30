import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

interface GalleryEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  venue: string;
  description: string | null;
  externalLink: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
}

const blank = (): Omit<GalleryEvent, 'id' | 'createdAt'> => ({
  title: '', date: '', time: '', venue: '', description: '', externalLink: '', imageUrl: null, published: false,
});

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function AdminEvents() {
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryEvent | null>(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<GalleryEvent[]>('/api/events/all')
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm(blank()); setShowForm(true); };
  const openEdit = (ev: GalleryEvent) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      date: ev.date.slice(0, 10),
      time: ev.time ?? '',
      venue: ev.venue,
      description: ev.description ?? '',
      externalLink: ev.externalLink ?? '',
      imageUrl: ev.imageUrl,
      published: ev.published,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        date: form.date,
        time: form.time || null,
        venue: form.venue,
        description: form.description || null,
        externalLink: normalizeUrl(form.externalLink),
        imageUrl: form.imageUrl || null,
        published: form.published,
      };
      if (editing) {
        const updated = await apiFetch<GalleryEvent>(`/api/events/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setEvents((prev) => prev.map((ev) => ev.id === updated.id ? updated : ev));
      } else {
        const created = await apiFetch<GalleryEvent>('/api/events', { method: 'POST', body: JSON.stringify(payload) });
        setEvents((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      }
      closeForm();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const togglePublished = async (ev: GalleryEvent) => {
    const updated = await apiFetch<GalleryEvent>(`/api/events/${ev.id}`, {
      method: 'PATCH', body: JSON.stringify({ published: !ev.published }),
    }).catch(console.error);
    if (updated) setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
  };

  const deleteEvent = async (ev: GalleryEvent) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    await apiFetch(`/api/events/${ev.id}`, { method: 'DELETE' }).catch(console.error);
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
  };

  const now = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((ev) => ev.date.slice(0, 10) >= now);
  const past = events.filter((ev) => ev.date.slice(0, 10) < now);

  if (loading) return <p className="text-text/70">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">Events</h2>
          <p className="text-sm text-text/50 mt-1">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button onClick={openNew} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accentHover">
          + Add Event
        </button>
      </div>

      {events.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface/60 py-16 text-center">
          <p className="text-text/50">No events yet. Add your first event above.</p>
        </div>
      )}

      {[{ label: 'Upcoming', list: upcoming }, { label: 'Past', list: past }].map(({ label, list }) => {
        if (!list.length) return null;
        return (
          <section key={label} className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">{label}</h3>
            {list.map((ev) => (
              <div key={ev.id} className="rounded-2xl border border-border bg-surface/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text">{ev.title}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ev.published ? 'bg-green-500/15 text-green-400' : 'bg-border text-text/50'}`}>
                        {ev.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-text/60">
                      {formatDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''} · {ev.venue}
                    </p>
                    {ev.description && <p className="text-sm text-text/50 line-clamp-2">{ev.description}</p>}
                    {ev.externalLink && (
                      <a href={ev.externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                        More info →
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3 items-start">
                    <button onClick={() => togglePublished(ev)} className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition">
                      {ev.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => openEdit(ev)} className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition">
                      Edit
                    </button>
                    <button onClick={() => deleteEvent(ev)} className="text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {/* Add / Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-bg p-8 shadow-2xl my-auto">
            <h3 className="text-xl font-semibold text-text mb-6">{editing ? 'Edit Event' : 'New Event'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Title</label>
                <input required value={form.title} onChange={set('title')}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Date</label>
                  <input type="date" required value={form.date} onChange={set('date')}
                    className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Time (optional)</label>
                  <input placeholder="e.g. 2:00 PM – 5:00 PM" value={form.time ?? ''} onChange={set('time')}
                    className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Venue / Location</label>
                <input required value={form.venue} onChange={set('venue')}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Description (optional)</label>
                <textarea rows={3} value={form.description ?? ''} onChange={set('description')}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">More Info Link (optional)</label>
                <input placeholder="e.g. eventsite.com/my-show" value={form.externalLink ?? ''} onChange={set('externalLink')}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
                <p className="text-xs text-text/40 mt-1">https:// added automatically if omitted.</p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text/50 mb-1.5">Image URL (optional)</label>
                <input placeholder="https://… (R2 or any public image URL)" value={form.imageUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value || null }))}
                  className="w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-sm text-text outline-none focus:border-accent" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-accent" />
                <span className="text-sm text-text/70">Published (visible on public site)</span>
              </label>
              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <button type="button" onClick={closeForm}
                  className="rounded-xl border border-border px-5 py-3 text-sm text-text/60 transition hover:text-text">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
