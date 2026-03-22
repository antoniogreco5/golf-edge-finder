'use client';

import { EdgeOpportunity } from '@/types';
import { motion } from 'framer-motion';

interface EdgeCardProps {
  edge: EdgeOpportunity;
  index: number;
  bankroll?: number;
}

export default function EdgeCard({ edge, index, bankroll = 1000 }: EdgeCardProps) {
  const tierStyles = {
    strong: {
      border: 'border-green-500/30',
      bg: 'bg-green-950/30',
      glow: 'edge-strong',
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      barColor: 'bg-green-500',
    },
    playable: {
      border: 'border-yellow-500/20',
      bg: 'bg-yellow-950/20',
      glow: 'edge-playable',
      badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
      barColor: 'bg-yellow-500',
    },
    monitor: {
      border: 'border-slate-600/20',
      bg: 'bg-slate-800/20',
      glow: '',
      badge: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
      barColor: 'bg-slate-500',
    },
    none: {
      border: 'border-slate-700/10',
      bg: 'bg-slate-900/10',
      glow: '',
      badge: 'bg-slate-700/10 text-slate-500 border-slate-700/20',
      barColor: 'bg-slate-600',
    },
  };

  const style = tierStyles[edge.tier];
  const betAmount = bankroll * edge.quarter_kelly;
  const contracts = Math.floor(betAmount / (edge.contract_price / 100));
  const potentialProfit = contracts * (1 - edge.contract_price / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`
        relative rounded-xl border ${style.border} ${style.bg} ${style.glow}
        p-5 transition-all duration-300 hover:scale-[1.01]
      `}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg text-white tracking-tight">
              {edge.player_name}
            </h3>
            {edge.is_live && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
                Live
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-mono">{edge.market_label}</span>
        </div>

        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider ${style.badge}`}>
          {edge.tier === 'strong' ? '● Strong' : edge.tier === 'playable' ? '◐ Playable' : '○ Monitor'}
        </div>
      </div>

      {/* Probability Comparison */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Model</div>
          <div className="font-mono text-base font-bold text-white">{edge.model_prob.toFixed(1)}%</div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Market</div>
          <div className="font-mono text-base font-bold text-slate-300">{edge.market_prob.toFixed(1)}%</div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Edge</div>
          <div className={`font-mono text-base font-bold ${edge.edge > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {edge.edge > 0 ? '+' : ''}{edge.edge.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Edge Bar Visualization */}
      <div className="mb-4">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${style.barColor} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(100, Math.max(2, edge.edge_pct))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-600">0%</span>
          <span className="text-[10px] text-slate-500 font-mono">{edge.edge_pct.toFixed(0)}% relative edge</span>
        </div>
      </div>

      {/* Sizing Row */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">Contract</div>
          <div className="font-mono text-xs text-slate-300">${(edge.contract_price / 100).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">¼ Kelly</div>
          <div className="font-mono text-xs text-slate-300">{(edge.quarter_kelly * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">Bet Size</div>
          <div className="font-mono text-xs text-white">${betAmount.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5">Liquidity</div>
          <div className={`font-mono text-xs ${
            edge.liquidity_grade === 'A' ? 'text-green-400' :
            edge.liquidity_grade === 'B' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {edge.liquidity_grade} ({edge.volume})
          </div>
        </div>
      </div>

      {/* Expected Value Footer */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          EV: <span className={`font-mono ${edge.expected_value > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {edge.expected_value > 0 ? '+' : ''}{edge.expected_value.toFixed(1)}¢
          </span>
          /contract
        </span>
        {contracts > 0 && (
          <span className="text-[10px] text-slate-500">
            {contracts} contracts → <span className="text-green-400 font-mono">${potentialProfit.toFixed(2)}</span> potential
          </span>
        )}
      </div>
    </motion.div>
  );
}
