import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Commission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  description: string;
  size?: string;
  budget?: number | null;
  deadline?: string | null;
  status: string;
  createdAt: string;
}

type Group = 'commission' | 'class' | 'painting' | 'other';

interface Item {
  id: string;
  kind: 'contact' | 'commission';
  group: Group;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  meta?: string; // size, budget, deadline for commissions
}

function classify(subject: string): Group {
  if (subject.toLowerCase().startsWith('inquiry:')) return 'painting';
  if (subject.toLowerCase().includes('class')) return 'class';
  return 'other';
}

const groupLabels: Record<Group, string> = {
  commission: 'Commissions',
  class: 'Classes',
  painting: 'Painting Inquiries',
  other: 'Other',
};

const groupOrder: Group[] = ['commission', 'class', 'painting', 'other'];

export default function AdminContact() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<ContactMsg[]>('/api/contact').catch(() => [] as ContactMsg[]),
      apiFetch<Commission[]>('/api/commissions').catch(() => [] as Commission[]),
    ]).then(([msgs, commissions]) => {
      const contactItems: Item[] = msgs.map((m) => ({
        id: m.id,
        kind: 'contact',
        group: classify(m.subject),
        name: m.name,
        email: m.email,
        phone: m.phone,
        subject: m.subject,
        body: m.message,
        read: m.read,
        createdAt: m.createdAt,
      }));

      const commissionItems: Item[] = commissions.map((c) => {
        const parts = [
          c.size && `Size: ${c.size}`,
          c.budget != null && `Budget: $${c.budget.toLocaleString()}`,
          c.deadline && `Deadline: ${c.deadline}`,
          `Status: ${c.status}`,
        ].filter(Boolean);
        return {
          id: c.id,
          kind: 'commission',
          group: 'commission',
          name: c.name,
          email: c.email,
          phone: c.phone,
          subject: c.subject,
          body: c.description,
          read: false,
          createdAt: c.createdAt,
          meta: parts.join(' · '),
        };
      });

      const all = [...contactItems, ...commissionItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setItems(all);
    }).finally(() => setLoading(false));
  }, []);

  const markRead = async (item: Item) => {
    if (item.kind !== 'contact') return;
    await apiFetch(`/api/contact/${item.id}/read`, { method: 'PATCH' }).catch(console.error);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
  };

  if (loading) return <p className="text-text/70">Loading…</p>;

  const grouped = groupOrder.reduce<Record<Group, Item[]>>(
    (acc, g) => { acc[g] = items.filter((i) => i.group === g); return acc; },
    { commission: [], class: [], painting: [], other: [] },
  );

  const unread = items.filter((i) => i.kind === 'contact' && !i.read).length;

  return (
    <div className="space-y-10">
      <div className="flex items-baseline gap-4">
        <h2 className="text-2xl font-semibold text-text">All Inquiries</h2>
        {unread > 0 && (
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
            {unread} unread
          </span>
        )}
      </div>

      {items.length === 0 && <p className="text-text/60">No messages yet.</p>}

      {groupOrder.map((g) => {
        const group = grouped[g];
        if (!group.length) return null;
        return (
          <section key={g} className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.3em] text-accent/80">{groupLabels[g]}</h3>
            {group.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border ${item.kind === 'contact' && !item.read ? 'border-accent/50 bg-accent/5' : 'border-border'} bg-bg/90 p-5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text">
                      {item.name}{' '}
                      <span className="text-sm font-normal text-text/60">— {item.email}</span>
                    </p>
                    <p className="mt-1 text-sm text-text/70">{item.subject}</p>
                    <p className="mt-1 text-xs text-text/50">
                      {new Date(item.createdAt).toLocaleDateString()}
                      {item.kind === 'contact' && !item.read && ' · Unread'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    {item.kind === 'contact' && !item.read && (
                      <button
                        onClick={() => markRead(item)}
                        className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition"
                    >
                      {expanded === item.id ? 'Close' : 'View'}
                    </button>
                  </div>
                </div>
                {expanded === item.id && (
                  <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4 text-sm text-text/80 whitespace-pre-wrap leading-7">
                    {item.body}
                    {item.meta && <p className="mt-3 text-xs text-text/50">{item.meta}</p>}
                    {item.phone && <p className="mt-2 text-text/60">Phone: {item.phone}</p>}
                  </div>
                )}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
