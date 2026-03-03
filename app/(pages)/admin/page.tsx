'use client';

import { useState, useEffect, useCallback } from 'react';
import StatsBar from '../../../components/StatsBar';
import EntriesTable from '../../../components/EntriesTable';
import AnalyticsPanel from '../../../components/AnalyticsPanel';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 12V8M6 12V5M10 12V7M14 12V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M5 3H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VIEWS = [
  { id: 'overview',   label: 'Overview',   icon: IconGrid },
  { id: 'entries',    label: 'Entries',    icon: IconList },
  { id: 'analytics',  label: 'Analytics',  icon: IconChart },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Stats {
  pending: number;
  [key: string]: number;
}

export default function AdminWaitlistPage() {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/waitlist?limit=1');
      const data = await res.json();
      if (data.success && data.stats) setStats(data.stats);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="flex h-screen bg-[#faf9f7] overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-[#16252D] flex flex-col">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/8">
          <span className="text-base font-bold tracking-tight text-white">
            Junior<span className="text-[#685EFC]">Forge</span>
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#37ffb7]" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#37ffb7]/80">
              Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                font-medium transition-all duration-150 text-left
                ${activeView === id
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <Icon />
              {label}
              {id === 'entries' && stats && stats.pending > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-[#685EFC] text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {stats.pending > 9 ? '9+' : stats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 border-t border-white/8 pt-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-[11px] font-semibold text-white/40 truncate">Waitlist</p>
            <p className="text-[11px] text-white/25 truncate">Management</p>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150">
            <IconLogout />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 bg-white border-b border-[#ede9e5] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#16252D] tracking-tight">
              {VIEWS.find(v => v.id === activeView)?.label}
            </h1>
            <p className="text-xs text-[#A49595] mt-0.5">
              {activeView === 'overview'  && 'Waitlist performance at a glance'}
              {activeView === 'entries'   && 'All waitlist signups — review, approve, invite'}
              {activeView === 'analytics' && 'Trends, distributions, and growth data'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#A49595]">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={fetchStats}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#685EFC] border border-[#685EFC]/30 rounded-lg hover:bg-[#685EFC]/5 transition-all duration-150"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 6a4 4 0 1 1-1.17-2.83M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'overview' && (
            <div className="p-8 space-y-8">
              <StatsBar stats={stats} loading={statsLoading} />
              <EntriesTable
                defaultLimit={8}
                compact
                onNeedRefresh={fetchStats}
              />
            </div>
          )}
          {activeView === 'entries' && (
            <div className="p-8">
              <EntriesTable onNeedRefresh={fetchStats} />
            </div>
          )}
          {activeView === 'analytics' && (
            <div className="p-8">
              <AnalyticsPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}