'use client';

import { EdgeOpportunity } from '@/types';

interface EdgeCardProps {
  edge: EdgeOpportunity;
  index: number;
  bankroll?: number;
}

export default function EdgeCard({ edge, index, bankroll = 1000 }: EdgeCardProps) {
  const isStrong = edge.tier === 'strong';
  const isPlayable = edge.tier === 'playable';
  const tierClass = isStrong ? 'tier-strong' : isPlayable ? 'tier-playable' : 'tier-monitor';
  const edgeColor = isStrong ? 'var(--accent)' : isPlayable ? 'var(--amber)' : 'var(--text-muted)';

  const betAmount = bankroll * edge.quarter_kelly;

  // "Last, First" → "First Last"
  const name = edge.player_name.includes(',')
    ? edge.player_name.split(',').reverse().map(s => s.trim()).join(' ')
    : edge.player_name;

  // Friendly book names
  const bookName = edge.kalshi_ticker
    ? edge.kalshi_ticker.charAt(0).toUpperCase() + edge.kalshi_ticker.slice(1).replace(/([A-Z])/g, ' $1')
    : '';

  return (
    <div className={`card ${tierClass} px-5 py-4 enter`} style={{ animationDelay: `${index * 0.035}s` }}>
      {/* Row 1: Identity */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug" style={{ color: 'var(--text-primary)' }}>{name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{edge.market_label}</span>
            {bookName && (
              <>
                <span style={{ color: 'var(--text-faint)' }}>&middot;</span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{bookName}</span>
              </>
            )}
          </div>
        </div>
        {/* Edge as the hero element */}
        <div className="flex-shrink-0 text-right">
          <div className="font-mono text-lg font-bold leading-none" style={{ color: edgeColor }}>
            +{edge.edge.toFixed(1)}
          </div>
          <div className="text-2xs mt-0.5" style={{ color: 'var(--text-faint)' }}>pt edge</div>
        </div>
      </div>

      {/* Row 2: Data grid */}
      <div className="grid grid-cols-4 gap-3">
        <DataCell label="Model" value={`${edge.model_prob.toFixed(1)}%`} primary />
        <DataCell label="Market" value={`${edge.market_prob.toFixed(1)}%`} />
        <DataCell label="Sizing" value={`${(edge.quarter_kelly * 100).toFixed(1)}%`} sublabel="¼ Kelly" />
        <DataCell label="Bet size" value={`$${betAmount < 1 ? betAmount.toFixed(2) : betAmount.toFixed(0)}`} primary />
      </div>
    </div>
  );
}

function DataCell({ label, value, sublabel, primary }: {
  label: string; value: string; sublabel?: string; primary?: boolean;
}) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
        {label}{sublabel && <span style={{ color: 'var(--text-faint)', opacity: 0.6 }}> · {sublabel}</span>}
      </div>
      <div className="font-mono text-sm" style={{ color: primary ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: primary ? 600 : 400 }}>
        {value}
      </div>
    </div>
  );
}
