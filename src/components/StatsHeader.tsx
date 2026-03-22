'use client';

import { TournamentEdgeScan } from '@/types';

interface StatsHeaderProps {
  scan: TournamentEdgeScan | null;
  isLoading: boolean;
  lastRefresh: string | null;
}

export default function StatsHeader({ scan, isLoading, lastRefresh }: StatsHeaderProps) {
  if (!scan && !isLoading) return null;

  return (
    <div className="mb-6 enter">
      {/* Event row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1 mb-4">
        <div>
          <span className="section-label" style={{ color: 'var(--text-faint)' }}>Current Event</span>
          <h2 className="font-display text-xl md:text-2xl mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {isLoading ? <span className="skeleton inline-block w-44 h-6" /> : scan?.tournament}
          </h2>
        </div>
        {lastRefresh && !isLoading && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
            {new Date(lastRefresh).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} ET
          </span>
        )}
      </div>

      {/* Metric pills */}
      <div className="flex flex-wrap gap-2">
        <Pill label="Strong" value={scan?.strong_count || 0} color="var(--accent)" bg="var(--accent-muted)" loading={isLoading} />
        <Pill label="Playable" value={scan?.playable_count || 0} color="var(--amber)" bg="var(--amber-muted)" loading={isLoading} />
        <Pill label="Total edges" value={scan?.edges.length || 0} color="var(--text-secondary)" bg="rgba(255,255,255,0.04)" loading={isLoading} />
        <Pill label="Players scanned" value={scan?.total_scanned || 0} color="var(--text-muted)" bg="rgba(255,255,255,0.03)" loading={isLoading} />
      </div>
    </div>
  );
}

function Pill({ label, value, color, bg, loading }: { label: string; value: number; color: string; bg: string; loading: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: bg }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-mono text-sm font-semibold" style={{ color: loading ? 'var(--text-faint)' : color }}>
        {loading ? '—' : value}
      </span>
    </div>
  );
}
