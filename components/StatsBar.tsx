'use client';

// ─── StatsBar ─────────────────────────────────────────────────────────────────
// Renders 5 KPI cards: total, pending, approved, notified, today

const CARDS = [
  {
    key:     'total',
    label:   'Total Signups',
    color:   '#16252D',
    bgColor: '#f0f4f4',
    dot:     '#16252D',
  },
  {
    key:     'pending',
    label:   'Pending Review',
    color:   '#b45309',
    bgColor: '#fffbeb',
    dot:     '#f59e0b',
  },
  {
    key:     'approved',
    label:   'Approved',
    color:   '#12895E',
    bgColor: '#f0fdf6',
    dot:     '#12895E',
  },
  {
    key:     'notified',
    label:   'Invited',
    color:   '#685EFC',
    bgColor: '#f5f3ff',
    dot:     '#685EFC',
  },
  {
    key:     'today',
    label:   "Today's Signups",
    color:   '#16252D',
    bgColor: '#faf9f7',
    dot:     '#A49595',
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#ede9e5] p-5 animate-pulse">
      <div className="h-3 w-24 bg-[#f0ece8] rounded mb-4" />
      <div className="h-8 w-16 bg-[#f0ece8] rounded mb-2" />
      <div className="h-2.5 w-12 bg-[#f5f2f0] rounded" />
    </div>
  );
}

export default function StatsBar({ stats, loading }: { stats: Record<string, number> | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {CARDS.map(c => <SkeletonCard key={c.key} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, color, bgColor, dot }) => {
        const value = stats[key] ?? 0;
        const isHighlight = key === 'pending' && value > 0;

        return (
          <div
            key={key}
            className={`
              bg-white rounded-xl border p-5 transition-all duration-200
              ${isHighlight
                ? 'border-amber-200 shadow-sm shadow-amber-50'
                : 'border-[#ede9e5] hover:border-[#d8d4d0]'
              }
            `}
          >
            {/* Label row */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: dot }}
              />
              <span className="text-[11px] font-semibold tracking-wide uppercase text-[#A49595]">
                {label}
              </span>
            </div>

            {/* Value */}
            <p
              className="text-3xl font-bold tracking-tight leading-none"
              style={{ color }}
            >
              {value.toLocaleString()}
            </p>

            {/* Context chip */}
            {key === 'pending' && value > 0 && (
              <div
                className="inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                style={{ backgroundColor: bgColor, color }}
              >
                Needs attention
              </div>
            )}
            {key === 'notified' && stats.total > 0 && (
              <p className="text-[11px] text-[#A49595] mt-1.5">
                {Math.round((value / stats.total) * 100)}% of total
              </p>
            )}
            {key === 'today' && value > 0 && (
              <p className="text-[11px] text-[#12895E] mt-1.5 font-medium">
                +{value} new
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}