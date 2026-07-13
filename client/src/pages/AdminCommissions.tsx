import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

interface CommissionRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<CommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CommissionRequest[]>('/api/commissions')
      .then(setCommissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text/70">Loading commissions…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-text">Commission Requests</h2>
      {!commissions.length && <p className="text-text/60">No commission requests yet.</p>}
      {commissions.map((req) => (
        <div key={req.id} className="rounded-xl border border-border bg-bg/90 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-text">
                {req.name}{' '}
                <span className="text-sm font-normal text-text/60">— {req.email}</span>
              </p>
              <p className="mt-1 text-sm text-text/70">{req.subject}</p>
              <p className="mt-1 text-xs text-text/50">
                {new Date(req.createdAt).toLocaleDateString()} ·{' '}
                <span className="uppercase tracking-wider">{req.status}</span>
              </p>
            </div>
            <button
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              className="flex-shrink-0 text-xs uppercase tracking-widest text-text/50 hover:text-text transition"
            >
              {expanded === req.id ? 'Close' : 'View'}
            </button>
          </div>
          {expanded === req.id && (
            <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4 text-sm text-text/80 whitespace-pre-wrap leading-7">
              {req.description}
              {req.phone && <p className="mt-3 text-text/60">Phone: {req.phone}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
