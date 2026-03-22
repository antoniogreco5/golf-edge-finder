'use client';

import { EdgeOpportunity } from '@/types';

interface EdgeCardProps {
  edge: EdgeOpportunity;
  index: number;
  bankroll?: number;
}

export default function EdgeCard({ edge, index, bankroll = 1000 }: EdgeCardProps) {
  const tierClass = edge.tier === 'strong' ? 'tier-strong' : edge.tier === 'playable' ? 'tier-playable' : 'tier-monitor';
  const tierColor = edge.tier === 'strong' ? 'var(--accent-green)' : edge.tier === 'playable' ? 'var(--accent-amber)' : 'var(--text-muted)';
  const tierBg = edge.tier === 'strong' ? 'var(--accent-green-muted)' : edge.tier === 'playable' ? 'var(--accent-amber-muted)' : 'rgba(255,255,255,0.04)';
  const tierLabel = edge.tier === 'strong' ? 'Strong' : edge.tier === 'playable' ? 'Playable' : 'Monitor';

  const betAmount = bankroll * edge.quarter_kelly;
  const contracts = Math.floor(betAmount / (edge.contract_price / 100));
  const potentialProfit = contracts * (1 - edge.contract_price / 100);

  // Clean player name: "Last, First" → "First Last"
  const cleanName = edge.player_name.includes(',')
    ? edge.player_name.split(',').reverse().map(s => s.trim()).join(' ')
    : edge.player_name;

  return (
    <div
      className={`surface-card ${tierClass} px-5 py-4 animate-fade-in`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Top row: Player name, market, tier badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
              {cleanName}
            </h3>
            {edge.is_live && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent-green)' }}>
                <span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ background: 'var(--accent-green)' }} />
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{edge.market_label}</span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>vs {edge.kalshi_ticker}</span>
          </div>
        </div>
        <span
          className="flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
          style={{ background: tierBg, color: tierColor }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Main data row */}
      <div className="grid grid-cols-5 gap-3 items-end">
        {/* Model */}
        <div>
          <div className="text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Model</div>
          <div className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {edge.model_prob.toFixed(1)}%
          </div>
        </div>

        {/* Book */}
        <div>
          <div className="text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Book</div>
          <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            {edge.market_prob.toFixed(1)}%
          </div>
        </div>

        {/* Edge - the hero number */}
        <div>
          <div className="text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Edge</div>
          <div className="font-mono text-sm font-bold" style={{ color: tierColor }}>
            +{edge.edge.toFixed(1)}pt
          </div>
        </div>

        {/* Kelly */}
        <div>
          <div className="text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Kelly ¼</div>
          <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            {(edge.quarter_kelly * 100).toFixed(1)}%
          </div>
        </div>

        {/* Suggested Bet */}
        <div className="text-right">
          <div className="text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Suggested</div>
          <div className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${betAmount < 1 ? betAmount.toFixed(2) : betAmount.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Bottom row: EV and potential */}
      {contracts > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            EV: <span className="font-mono" style={{ color: 'var(--accent-green)' }}>+{edge.expected_value.toFixed(1)}¢</span> per contract
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {contracts} contracts → <span style={{ color: 'var(--accent-green)' }}>${potentialProfit.toFixed(2)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
