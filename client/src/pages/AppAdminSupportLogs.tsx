import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

interface SupportLogEntry {
  id: string;
  galleryId: string;
  gallery: { name: string; slug: string };
  category: 'suggestion' | 'bug' | 'escalation';
  priority: 'low' | 'medium' | 'high';
  summary: string;
  detail: string | null;
  createdAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  high:   'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low:    'bg-border text-text/50',
};

const CATEGORY_STYLES: Record<string, string> = {
  bug:        'bg-red-500/10 text-red-300',
  suggestion: 'bg-accent/10 text-accent',
  escalation: 'bg-purple-500/10 text-purple-300',
};

export default function AppAdminSupportLogs() {
  const [logs, setLogs] = useState<SupportLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SupportLogEntry[]>('/api/app-admin/support-logs')
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dismiss = async (id: string) => {
    setDismissing(id);
    try {
      await apiFetch(`/api/app-admin/support-logs/${id}`, { method: 'DELETE' });
      setLogs((prev) => prev.filter((l) => l.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDismissing(null);
    }
  };

  if (loading) return <p className="text-text/50">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-text">Support Logs</h2>
        <p className="text-sm text-text/40">{logs.length} item{logs.length !== 1 ? 's' : ''}</p>
      </div>

      {logs.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface/60 py-16 text-center">
          <p className="text-text/40">No logged items yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CATEGORY_STYLES[log.category]}`}>
                    {log.category}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[log.priority]}`}>
                    {log.priority} priority
                  </span>
                  <span className="text-xs text-text/40">{log.gallery.name}</span>
                  <span className="text-xs text-text/30">
                    {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="font-medium text-text">{log.summary}</p>
              </div>
              <div className="flex shrink-0 gap-3 items-center">
                {log.detail && (
                  <button
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="text-xs uppercase tracking-widest text-accent hover:text-accentHover transition"
                  >
                    {expanded === log.id ? 'Less' : 'Detail'}
                  </button>
                )}
                <button
                  onClick={() => dismiss(log.id)}
                  disabled={dismissing === log.id}
                  className="text-xs uppercase tracking-widest text-text/30 hover:text-red-400 transition disabled:opacity-40"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {expanded === log.id && log.detail && (
              <p className="rounded-xl bg-surface-raised px-4 py-3 text-sm text-text/70 whitespace-pre-wrap border border-border">
                {log.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
