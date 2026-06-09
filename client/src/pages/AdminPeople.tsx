import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface NewsletterSub {
  id: string;
  active: boolean;
  subscribedAt: string;
  source: string | null;
}

interface ContactMsg {
  id: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface CommissionReq {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  _count?: { contacts: number; commissions: number };
  newsletter?: { active: boolean } | null;
  contacts?: ContactMsg[];
  commissions?: CommissionReq[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New', REVIEWING: 'Reviewing', QUOTED: 'Quoted',
  ACCEPTED: 'Accepted', IN_PROGRESS: 'In Progress', COMPLETE: 'Complete', DECLINED: 'Declined',
};

export default function AdminPeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Person | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Person[]>('/api/people')
      .then(setPeople)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openPerson = async (p: Person) => {
    setSelected(p);
    setEditing(false);
    setDetailLoading(true);
    try {
      const detail = await apiFetch<Person>(`/api/people/${p.id}`);
      setSelected(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const startEdit = (p: Person) => {
    setEditForm({ name: p.name, email: p.email, phone: p.phone || '', notes: p.notes || '' });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Person>(`/api/people/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...editForm, phone: editForm.phone || null, notes: editForm.notes || null }),
      });
      setSelected(updated);
      setPeople((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleNewsletter = async (p: Person) => {
    if (!p.newsletter) return;
    try {
      // find subscriber id from detail
      const detail = selected?.id === p.id ? selected : await apiFetch<Person & { newsletter: NewsletterSub }>(`/api/people/${p.id}`);
      const sub = (detail as Person & { newsletter: NewsletterSub }).newsletter;
      if (!sub) return;
      await apiFetch(`/api/newsletter/subscribers/${sub.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !sub.active }),
      });
      const newActive = !sub.active;
      setPeople((prev) => prev.map((x) => x.id === p.id ? { ...x, newsletter: { active: newActive } } : x));
      if (selected?.id === p.id) setSelected((s) => s ? { ...s, newsletter: { ...sub, active: newActive } } : s);
    } catch (err) {
      console.error(err);
    }
  };

  const deletePerson = async (p: Person) => {
    if (!confirm(`Delete ${p.name} (${p.email}) and all their records?`)) return;
    try {
      await apiFetch(`/api/people/${p.id}`, { method: 'DELETE' });
      setPeople((prev) => prev.filter((x) => x.id !== p.id));
      if (selected?.id === p.id) setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-text/70">Loading…</p>;

  return (
    <div className="flex gap-6 min-h-[600px]">

      {/* List */}
      <div className={`flex flex-col gap-2 ${selected ? 'w-80 shrink-0' : 'flex-1'}`}>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-2xl font-semibold text-text">People</h2>
          <span className="text-xs text-text/50">{people.length} total</span>
        </div>
        {people.length === 0 && <p className="text-text/60 text-sm">No people yet.</p>}
        {people.map((p) => (
          <button
            key={p.id}
            onClick={() => openPerson(p)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition ${
              selected?.id === p.id
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface/60 hover:border-accent/40'
            }`}
          >
            <p className="font-semibold text-text text-sm">{p.name}</p>
            <p className="text-xs text-text/60 mt-0.5">{p.email}</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {p.newsletter?.active && (
                <span className="text-[10px] uppercase tracking-widest bg-accent/15 text-accent px-2 py-0.5 rounded-full">Newsletter</span>
              )}
              {(p._count?.contacts ?? 0) > 0 && (
                <span className="text-[10px] text-text/50">{p._count!.contacts} msg{p._count!.contacts !== 1 ? 's' : ''}</span>
              )}
              {(p._count?.commissions ?? 0) > 0 && (
                <span className="text-[10px] text-text/50">{p._count!.commissions} commission{p._count!.commissions !== 1 ? 's' : ''}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      {selected && (
        <div className="flex-1 min-w-0 space-y-6">
          <div className="rounded-2xl border border-border bg-surface/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {editing ? (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                      placeholder="Name"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                      placeholder="Email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    <input
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                      placeholder="Phone (optional)"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <textarea
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent resize-none"
                      placeholder="Admin notes (optional)"
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-text">{selected.name}</h3>
                    <p className="text-sm text-text/70 mt-1">{selected.email}</p>
                    {selected.phone && <p className="text-sm text-text/60 mt-0.5">{selected.phone}</p>}
                    {selected.notes && (
                      <p className="mt-3 text-sm text-text/60 bg-bg/60 rounded-lg px-3 py-2 border border-border">{selected.notes}</p>
                    )}
                    <p className="text-xs text-text/40 mt-2">
                      Added {new Date(selected.createdAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
              {!editing && (
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(selected)}
                    className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition"
                  >
                    Edit
                  </button>
                  {selected.newsletter && (
                    <button
                      onClick={() => toggleNewsletter(selected)}
                      className={`text-xs uppercase tracking-widest transition ${
                        selected.newsletter.active
                          ? 'text-accent hover:text-accentHover'
                          : 'text-text/40 hover:text-text/60'
                      }`}
                    >
                      {selected.newsletter.active ? 'Unsubscribe' : 'Resubscribe'}
                    </button>
                  )}
                  <button
                    onClick={() => deletePerson(selected)}
                    className="text-xs uppercase tracking-widest text-red-400/70 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Newsletter status */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {selected.newsletter ? (
                <span className={`text-xs px-3 py-1 rounded-full ${selected.newsletter.active ? 'bg-accent/15 text-accent' : 'bg-border text-text/50'}`}>
                  Newsletter: {selected.newsletter.active ? 'Subscribed' : 'Unsubscribed'}
                </span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full bg-border text-text/40">Not subscribed</span>
              )}
            </div>
          </div>

          {detailLoading && <p className="text-text/60 text-sm">Loading history…</p>}

          {/* Contact messages */}
          {!detailLoading && (selected.contacts?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-[0.3em] text-accent/80">Contact Messages</h4>
              {selected.contacts!.map((m) => (
                <div key={m.id} className="rounded-xl border border-border bg-surface/60 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-text">{m.subject}</p>
                    <span className="text-xs text-text/40 shrink-0">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-text/70 whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </section>
          )}

          {/* Commission requests */}
          {!detailLoading && (selected.commissions?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-[0.3em] text-accent/80">Commission Requests</h4>
              {selected.commissions!.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-surface/60 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-text">{c.subject}</p>
                    <span className="text-xs text-text/40 shrink-0">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-accent/80 uppercase tracking-wider">{STATUS_LABELS[c.status] ?? c.status}</p>
                  <p className="mt-1 text-sm text-text/70 whitespace-pre-wrap">{c.description}</p>
                </div>
              ))}
            </section>
          )}

          {!detailLoading && (selected.contacts?.length ?? 0) === 0 && (selected.commissions?.length ?? 0) === 0 && (
            <p className="text-sm text-text/50">No contact history yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
