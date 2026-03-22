'use client';

import { TournamentEdgeScan } from '@/types';
import { motion } from 'framer-motion';

interface StatsHeaderProps {
  scan: TournamentEdgeScan | null;
  isLoading: boolean;
  lastRefresh: string | null;
}

export default function StatsHeader({ scan, isLoading, lastRefresh }: StatsHeaderProps) {
  if (!scan && !isLoading) {
    return (
      <div className="text-center py-16">
        <div className="font-display text-3xl text-slate-400 mb-2">No Scan Data</div>
        <p className="text-sm text-slate-500">Run a scan to find edges</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-8"
    >
      {/* Tournament Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {scan?.is_live && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
                Live
              </span>
            )}
            <span className="text-[11px] uppercase tracking-widest text-slate-500">
              {scan?.model_type === 'baseline_history_fit' ? 'DG Baseline + Course Fit' : 'DG Baseline'}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight">
            {scan?.tournament || 'Loading...'}
          </h1>
          {scan?.course && (
            <p className="text-sm text-slate-400 mt-0.5">{scan.course}</p>
          )}
        </div>

        {lastRefresh && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-600">Last Scan</div>
            <div className="text-xs text-slate-400 font-mono">
              {new Date(lastRefresh).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short',
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Strong Edges"
          value={isLoading ? '—' : String(scan?.strong_count || 0)}
          accent="green"
          isLoading={isLoading}
        />
        <StatCard
          label="Playable Edges"
          value={isLoading ? '—' : String(scan?.playable_count || 0)}
          accent="yellow"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Scanned"
          value={isLoading ? '—' : String(scan?.total_scanned || 0)}
          accent="slate"
          isLoading={isLoading}
        />
        <StatCard
          label="Actionable"
          value={isLoading ? '—' : String(scan?.edges.length || 0)}
          accent="slate"
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  accent,
  isLoading,
}: {
  label: string;
  value: string;
  accent: 'green' | 'yellow' | 'slate';
  isLoading: boolean;
}) {
  const accentColors = {
    green: 'border-green-500/20 text-green-400',
    yellow: 'border-yellow-500/20 text-yellow-400',
    slate: 'border-slate-600/20 text-slate-300',
  };

  return (
    <div className={`bg-black/20 border ${accentColors[accent].split(' ')[0]} rounded-xl p-4`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className={`font-mono text-2xl font-bold ${isLoading ? 'animate-pulse text-slate-600' : accentColors[accent].split(' ').slice(1).join(' ')}`}>
        {value}
      </div>
    </div>
  );
}
