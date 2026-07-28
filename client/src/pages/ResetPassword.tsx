import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function ResetPassword() {
  const { config } = useSiteConfig();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || 'Reset failed.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-sm text-red-400">Invalid reset link.</p>
          <button onClick={() => navigate('/admin')} className="text-xs text-text/40 hover:text-text/60 transition">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-accent/80">Gallery Admin</p>
          <h1 className="mt-3 text-2xl font-semibold text-text">{config.name || 'Reset Password'}</h1>
        </div>

        {done ? (
          <div className="rounded-2xl border border-border bg-surface/80 p-8 text-center space-y-4">
            <p className="text-sm text-text/80 leading-relaxed">
              Your password has been updated. All other sessions have been signed out.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover"
            >
              Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface/80 p-8">
            <p className="text-sm text-text/70">Enter your new password.</p>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-bg/90 px-4 py-3 text-text outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-bg/90 px-4 py-3 text-text outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
