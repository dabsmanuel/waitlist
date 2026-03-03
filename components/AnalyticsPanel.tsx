'use client';

import { useState, useEffect } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BarChart({ data, valueKey = 'count', labelKey = '_id', color = '#685EFC', height = 120 }: { data: any[]; valueKey?: string; labelKey?: string; color?: string; height?: number }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-xs text-[#A49595]">No data yet</div>
  );

  const max = Math.max(...data.map(d => d[valueKey]), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, i) => {
        const pct = (item[valueKey] / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative w-full flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center bg-[#16252D] text-white text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap z-10">
                {item[valueKey]}
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  minHeight: '3px',
                  maxHeight: `${height - 20}px`,
                  backgroundColor: pct > 70 ? color : pct > 40 ? `${color}cc` : `${color}66`
                }}
              />
            </div>
            <span className="text-[9px] text-[#A49595] truncate max-w-full text-center leading-none">
              {String(item[labelKey]).length > 8
                ? String(item[labelKey]).substring(0, 8) + '…'
                : item[labelKey]
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizBar({ label, value, max, color, subLabel }: { label: string; value: number; max: number; color: string; subLabel?: string | undefined }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#16252D] truncate">{label}</span>
        <div className="flex items-center gap-2">
          {subLabel && <span className="text-[10px] text-[#A49595]">{subLabel}</span>}
          <span className="text-xs font-bold text-[#16252D] tabular-nums w-6 text-right">{value}</span>
        </div>
      </div>
      <div className="h-1.5 bg-[#f0ece8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Card({ title, subtitle, children, loading }: { title: string; subtitle?: string; children?: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-[#ede9e5] p-6">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-[#16252D] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[#A49595] mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-[#f5f2f0] rounded-lg" />
          <div className="h-3 w-3/4 bg-[#f5f2f0] rounded" />
        </div>
      ) : children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsPanel() {
  interface AnalyticsData {
    weeklyTrend: Array<{ _id: { week: number }; count: number }>;
    stats: {
      total: number;
      pending: number;
      approved: number;
      notified: number;
      rejected: number;
    };
    sizeDistribution: Array<{ _id: string; count: number }>;
    topHiringRoles: Array<{ _id: string; count: number }>;
  }

  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/waitlist/analytics')
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.data);
        else setError('Failed to load analytics data.');
      })
      .catch(() => setError('Network error loading analytics.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Weekly trend: shape data for bar chart ─────────────────────────────────
  const weeklyData = (data?.weeklyTrend || []).map(w => ({
    count: w.count,
    _id: `W${w._id.week}`
  }));

  // ── Status distribution ────────────────────────────────────────────────────
  const stats = data?.stats || { total: 0, pending: 0, approved: 0, notified: 0, rejected: 0 };
  const statusData = [
    { label: 'Pending',  value: stats.pending  || 0, color: '#f59e0b' },
    { label: 'Approved', value: stats.approved || 0, color: '#12895E' },
    { label: 'Invited',  value: stats.notified || 0, color: '#685EFC' },
    { label: 'Rejected', value: stats.rejected || 0, color: '#ef4444' },
  ];
  const statusMax = Math.max(...statusData.map(s => s.value), 1);

  // ── Company size ───────────────────────────────────────────────────────────
  const sizeData = (data?.sizeDistribution || []).map(s => ({
    ...s,
    label: s._id
  }));
  const sizeMax = Math.max(...sizeData.map(s => s.count), 1);

  // ── Top hiring roles ───────────────────────────────────────────────────────
  const rolesData = (data?.topHiringRoles || []).slice(0, 8);
  const rolesMax  = Math.max(...rolesData.map(r => r.count), 1);

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#16252D] mb-1">Could not load analytics</p>
          <p className="text-xs text-[#A49595]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Row 1: Summary numbers ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: stats.total    || 0, color: '#16252D' },
          { label: 'This week', value: weeklyData.slice(-1)[0]?.count || 0, color: '#685EFC', suffix: 'new' },
          { label: 'Conv. rate', value: stats.total > 0 ? `${Math.round(((stats.notified || 0) / stats.total) * 100)}%` : '0%', color: '#12895E' },
          { label: 'Pending',   value: stats.pending  || 0, color: '#f59e0b' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="bg-white rounded-xl border border-[#ede9e5] px-5 py-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#A49595] mb-2">{label}</p>
            <p className="text-2xl font-bold tracking-tight" style={{ color }}>
              {loading ? <span className="inline-block w-10 h-6 bg-[#f5f2f0] rounded animate-pulse" /> : value}
              {suffix && !loading && <span className="text-sm font-medium text-[#A49595] ml-1.5">{suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Weekly trend + Status ───────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Weekly trend */}
        <div className="lg:col-span-2">
          <Card
            title="Weekly Signups"
            subtitle="Last 8 weeks"
            loading={loading}
          >
            {weeklyData.length > 0 ? (
              <BarChart
                data={weeklyData}
                height={140}
                color="#685EFC"
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-xs text-[#A49595]">
                Not enough data yet
              </div>
            )}
          </Card>
        </div>

        {/* Status breakdown */}
        <Card title="Status Breakdown" loading={loading}>
          <div className="space-y-3.5">
            {statusData.map(s => (
              <HorizBar
                key={s.label}
                label={s.label}
                value={s.value}
                max={statusMax}
                color={s.color}
                subLabel={stats.total > 0 ? `${Math.round((s.value / (stats.total || 1)) * 100)}%` : undefined}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Company size + Hiring roles ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Company size */}
        <Card
          title="Company Size"
          subtitle="Distribution of signups by headcount"
          loading={loading}
        >
          {sizeData.length > 0 ? (
            <div className="space-y-3">
              {sizeData.map(s => (
                <HorizBar
                  key={s._id}
                  label={`${s._id} employees`}
                  value={s.count}
                  max={sizeMax}
                  color="#12895E"
                  subLabel={stats.total > 0 ? `${Math.round((s.count / (stats.total || 1)) * 100)}%` : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-[#A49595]">No data yet</div>
          )}
        </Card>

        {/* Top hiring roles */}
        <Card
          title="Top Hiring Roles"
          subtitle="What roles startups are hiring for"
          loading={loading}
        >
          {rolesData.length > 0 ? (
            <div className="space-y-3">
              {rolesData.map((r, i) => (
                <HorizBar
                  key={r._id}
                  label={r._id}
                  value={r.count}
                  max={rolesMax}
                  color={i === 0 ? '#685EFC' : i === 1 ? '#12895E' : '#A49595'}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-[#A49595]">
              No role data yet — startups will select roles on signup
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Insights strip ──────────────────────────────── */}
      {!loading && data && (
        <div className="bg-[#16252D] rounded-xl px-6 py-5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-4">Quick Insights</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-1">Most common company size</p>
              <p className="text-sm font-semibold text-white">
                {sizeData[0]?._id ? `${sizeData[0]._id} employees` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1">Most requested role</p>
              <p className="text-sm font-semibold text-white">
                {rolesData[0]?._id || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1">Invite conversion rate</p>
              <p className="text-sm font-semibold text-[#37ffb7]">
                {stats.total > 0 ? `${Math.round(((stats.notified || 0) / stats.total) * 100)}%` : '0%'}
                <span className="text-white/30 font-normal ml-1.5 text-xs">of waitlist</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}