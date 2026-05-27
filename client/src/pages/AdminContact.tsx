import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminContact() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ContactMessage[]>('/api/contact')
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await apiFetch(`/api/contact/${id}/read`, { method: 'PATCH' }).catch(console.error);
    setMessages((msgs) => msgs.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  if (loading) return <p className="text-text/70">Loading messages…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-text">Contact Messages</h2>
      {!messages.length && <p className="text-text/60">No messages yet.</p>}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-xl border ${msg.read ? 'border-border' : 'border-accent/50 bg-accent/5'} bg-bg/90 p-5`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-text">
                {msg.name}{' '}
                <span className="text-sm font-normal text-text/60">— {msg.email}</span>
              </p>
              <p className="mt-1 text-sm text-text/70">{msg.subject}</p>
              <p className="mt-1 text-xs text-text/50">
                {new Date(msg.createdAt).toLocaleDateString()} {!msg.read && '· Unread'}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-3">
              {!msg.read && (
                <button
                  onClick={() => markRead(msg.id)}
                  className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                className="text-xs uppercase tracking-widest text-text/50 hover:text-text transition"
              >
                {expanded === msg.id ? 'Close' : 'View'}
              </button>
            </div>
          </div>
          {expanded === msg.id && (
            <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4 text-sm text-text/80 whitespace-pre-wrap leading-7">
              {msg.message}
              {msg.phone && <p className="mt-3 text-text/60">Phone: {msg.phone}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
