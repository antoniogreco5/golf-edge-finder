'use client';

import { TournamentEdgeScan } from '@/types';

interface StatsHeaderProps {
  scan: TournamentEdgeScan | null;
  isLoading: boolean;
  lastRefresh: string | null;
}

export default function StatsHeader({ scan, isLoading, lastRefresh }: StatsHeaderProps) {
  if (!scan && !isLoading) return null;

  const stats = [
    {
      label: 'Strong',
      value: scan?.strong_count || 0,
      color: 'var(--accent-green)',
      bg: 'var(--accent-green-muted)',
    },
    {
      label: 'Playable',
      value: scan?.playable_count || 0,
      color: 'var(--accent-amber)',
      bg: 'var(--accent-amber-muted)',
    },
    {
      label: 'Actionable',
      value: scan?.edges.length || 0,
      color: 'var(--text-primary)',
      bg: 'rgba(255,255,255,0.04)',
    },
    {
      label: 'Scanned',
      value: scan?.total_scanned || 0,
      color: 'var(--text-secondary)',
      bg: 'rgba(255,255,255,0.03)',
    },
  ];

  return (
    <div className="mb-6 animate-fade-in">
      {/* Tournament name and metadata */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Current Event
            </span>
            {scan?.is_live && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--accent-green)' }} />
                Live
              </span>
            )}
          </div>
          <h2 className="font-display text-xl md:text-2xl" style={{ color: 'var(--text-primary)' }}>
            {isLoading ? <span className="skeleton inline-block w-48 h-7" /> : scan?.tournament}
          </h2>
        </div>
        {lastRefresh && (
          <div className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
            Last scan: {new Date(lastRefresh).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
            })}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg px-4 py-3" style={{ background: s.bg }}>
            <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="font-mono text-xl font-semibold" style={{ color: isLoading ? 'var(--text-faint)' : s.color }}>
              {isLoading ? '—' : s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
