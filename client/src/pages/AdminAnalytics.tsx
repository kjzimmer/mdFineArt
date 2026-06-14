import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { apiFetch } from '../lib/api';

interface DailyPoint {
  date: string;
  uniqueVisitors: number;
  pageViews: number;
  requests: number;
  bandwidth: number;
}

interface CountryPoint { countryName: string; requests: number; pct: number; }

interface AnalyticsData {
  daily: DailyPoint[];
  totals: { uniqueVisitors: number; pageViews: number; requests: number };
  topCountries: CountryPoint[];
  lastUpdated: string;
  source: 'cloudflare' | 'mock';
}

const MOCK_COUNTRIES: CountryPoint[] = [
  { countryName: 'United States', requests: 0, pct: 68 },
  { countryName: 'Canada', requests: 0, pct: 9 },
  { countryName: 'United Kingdom', requests: 0, pct: 6 },
  { countryName: 'Australia', requests: 0, pct: 4 },
  { countryName: 'Other', requests: 0, pct: 13 },
];

const MOCK_DEVICES = [
  { name: 'Desktop', pct: 71 },
  { name: 'Mobile', pct: 24 },
  { name: 'Tablet', pct: 5 },
];

const MOCK_PAGES = [
  { path: '/gallery', views: 482 },
  { path: '/commission', views: 301 },
  { path: '/about', views: 189 },
  { path: '/events', views: 104 },
  { path: '/', views: 98 },
];

const MOCK_REFERRERS = [
  { host: 'direct / none', visits: 611 },
  { host: 'instagram.com', visits: 142 },
  { host: 'google.com', visits: 98 },
  { host: 'facebook.com', visits: 51 },
];

function makeMockDaily(days: number): DailyPoint[] {
  const result: DailyPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const base = 80 + Math.round(Math.random() * 120);
    result.push({
      date: label,
      uniqueVisitors: base,
      pageViews: Math.round(base * (2.5 + Math.random())),
      requests: Math.round(base * (5 + Math.random() * 3)),
      bandwidth: base * 50000,
    });
  }
  return result;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 px-6 py-5">
      <p className="text-xs uppercase tracking-[0.25em] text-text/50">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function SectionNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-accent/70 italic">{children}</p>;
}

const RANGE_OPTIONS = [7, 14, 30] as const;
type Range = typeof RANGE_OPTIONS[number];

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<AnalyticsData>(`/api/analytics?range=${range}`)
      .then(setData)
      .catch((err) => {
        console.error(err);
        setError('Could not load analytics. Using mock data.');
        setData({
          daily: makeMockDaily(range),
          totals: { uniqueVisitors: 0, pageViews: 0, requests: 0 },
          topCountries: MOCK_COUNTRIES,
          lastUpdated: new Date().toISOString(),
          source: 'mock',
        });
      })
      .finally(() => setLoading(false));
  }, [range]);

  const daily = data?.daily ?? [];
  const totals = data?.totals ?? { uniqueVisitors: 0, pageViews: 0, requests: 0 };
  const topCountries = data?.topCountries ?? MOCK_COUNTRIES;
  const isMock = data?.source === 'mock' || !data;

  const xTickInterval = range === 7 ? 0 : range === 14 ? 1 : 4;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading text-2xl font-semibold text-text">Analytics</h2>
          {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
          {!error && isMock && <p className="mt-1 text-sm text-text/50">Mock data — Cloudflare not yet connected</p>}
          {!error && !isMock && data?.lastUpdated && (
            <p className="mt-1 text-sm text-text/50">
              Updated {new Date(data.lastUpdated).toLocaleTimeString()} · cached 15 min
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${range === r ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text/60 hover:border-accent hover:text-accent'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-text/50">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Unique Visitors" value={totals.uniqueVisitors} />
            <StatCard label="Page Views" value={totals.pageViews} />
            <StatCard label="Total Requests" value={totals.requests} />
          </div>

          <div className="rounded-2xl border border-border bg-surface/60 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Visitors Over Time</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} interval={xTickInterval} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1612', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}
                    itemStyle={{ color: '#c4843a' }}
                  />
                  <Line type="monotone" dataKey="uniqueVisitors" name="Unique Visitors" stroke="#c4843a" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#c4843a' }} />
                  <Line type="monotone" dataKey="pageViews" name="Page Views" stroke="rgba(196,132,58,0.35)" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#c4843a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-5 text-xs text-text/50">
              <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent" />Unique visitors</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent/35" />Page views</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Top Countries</h3>
              <ul className="mt-4 space-y-3">
                {topCountries.map((c) => (
                  <li key={c.countryName} className="flex items-center gap-3">
                    <span className="w-32 truncate text-sm text-text/80">{c.countryName}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-border/40 h-1.5">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm text-text/50">{c.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Device Types</h3>
              <SectionNote>Requires Web Analytics beacon</SectionNote>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_DEVICES} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip contentStyle={{ background: '#1a1612', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} itemStyle={{ color: '#c4843a' }} formatter={(v) => [`${v}%`, 'Share']} />
                    <Bar dataKey="pct" name="Share" fill="#c4843a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Top Pages</h3>
              <SectionNote>Requires Web Analytics beacon</SectionNote>
              <ul className="mt-4 space-y-2">
                {MOCK_PAGES.map((p) => (
                  <li key={p.path} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-text/70">{p.path}</span>
                    <span className="text-text/50">{p.views.toLocaleString()} views</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Top Referrers</h3>
              <SectionNote>Requires Web Analytics beacon</SectionNote>
              <ul className="mt-4 space-y-2">
                {MOCK_REFERRERS.map((r) => (
                  <li key={r.host} className="flex items-center justify-between text-sm">
                    <span className="text-text/70">{r.host}</span>
                    <span className="text-text/50">{r.visits.toLocaleString()} visits</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
