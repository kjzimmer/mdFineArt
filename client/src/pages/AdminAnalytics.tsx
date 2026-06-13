import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

// --- Mock data (replaced by real Cloudflare API data after integration) ---

function makeMockDaily(days: number) {
  const result = [];
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
    });
  }
  return result;
}

const MOCK_COUNTRIES = [
  { countryName: 'United States', pct: 68 },
  { countryName: 'Canada', pct: 9 },
  { countryName: 'United Kingdom', pct: 6 },
  { countryName: 'Australia', pct: 4 },
  { countryName: 'Other', pct: 13 },
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

// -------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 px-6 py-5">
      <p className="text-xs uppercase tracking-[0.25em] text-text/50">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function SectionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-xs text-accent/70 italic">{children}</p>
  );
}

const RANGE_OPTIONS = [7, 14, 30] as const;
type Range = typeof RANGE_OPTIONS[number];

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>(30);
  const daily = makeMockDaily(range);

  const totals = daily.reduce(
    (acc, d) => ({
      uniqueVisitors: acc.uniqueVisitors + d.uniqueVisitors,
      pageViews: acc.pageViews + d.pageViews,
      requests: acc.requests + d.requests,
    }),
    { uniqueVisitors: 0, pageViews: 0, requests: 0 }
  );

  const xTickInterval = range === 7 ? 0 : range === 14 ? 1 : 4;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading text-2xl font-semibold text-text">Analytics</h2>
          <p className="mt-1 text-sm text-text/50">
            Mock data — Cloudflare integration coming soon
          </p>
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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Unique Visitors" value={totals.uniqueVisitors} />
        <StatCard label="Page Views" value={totals.pageViews} />
        <StatCard label="Total Requests" value={totals.requests} />
      </div>

      {/* Visitors over time */}
      <div className="rounded-2xl border border-border bg-surface/60 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Visitors Over Time</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                interval={xTickInterval}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1612', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}
                itemStyle={{ color: '#c4843a' }}
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                name="Unique Visitors"
                stroke="#c4843a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#c4843a' }}
              />
              <Line
                type="monotone"
                dataKey="pageViews"
                name="Page Views"
                stroke="rgba(196,132,58,0.35)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#c4843a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-5 text-xs text-text/50">
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent" />Unique visitors</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent/35" />Page views</span>
        </div>
      </div>

      {/* Countries + Devices */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/60 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/60">Top Countries</h3>
          <ul className="mt-4 space-y-3">
            {MOCK_COUNTRIES.map((c) => (
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
                <Tooltip
                  contentStyle={{ background: '#1a1612', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  itemStyle={{ color: '#c4843a' }}
                  formatter={(v) => [`${v}%`, 'Share']}
                />
                <Bar dataKey="pct" name="Share" fill="#c4843a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top pages + Referrers */}
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
    </div>
  );
}

// useState import needed at top — hoisted here to keep mock data adjacent
import { useState } from 'react';
