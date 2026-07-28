import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const { config } = useSiteConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'forgot-sent'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error();
      const { accessToken } = await res.json();
      login(accessToken);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setMode('forgot-sent');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-accent/80">Gallery Admin</p>
          <h1 className="mt-3 text-2xl font-semibold text-text">{config.name || 'Sign In'}</h1>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-border bg-surface/80 p-8">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-bg/90 px-4 py-3 text-text outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-bg/90 px-4 py-3 text-text outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(''); }}
              className="w-full text-center text-xs text-text/40 hover:text-text/60 transition pt-1"
            >
              Forgot password?
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4 rounded-2xl border border-border bg-surface/80 p-8">
            <p className="text-sm text-text/70 leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-bg/90 px-4 py-3 text-text outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition hover:bg-accentHover disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-text/40 hover:text-text/60 transition pt-1"
            >
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'forgot-sent' && (
          <div className="rounded-2xl border border-border bg-surface/80 p-8 text-center space-y-4">
            <p className="text-sm text-text/80 leading-relaxed">
              If that email is registered, a reset link is on its way. Check your inbox — the link expires in 1 hour.
            </p>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-text/40 hover:text-text/60 transition"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
