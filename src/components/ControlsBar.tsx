'use client';

import { useState } from 'react';
import { MarketType, EdgeTier } from '@/types';

export interface ScanOptions {
  tour: string;
  live: boolean;
  filterTier: EdgeTier | 'all';
  filterMarket: MarketType | 'all';
}

interface ControlsBarProps {
  onScan: (options: ScanOptions) => void;
  isLoading: boolean;
  bankroll: number;
  onBankrollChange: (v: number) => void;
}

export default function ControlsBar({ onScan, isLoading, bankroll, onBankrollChange }: ControlsBarProps) {
  const [tour, setTour] = useState('pga');
  const [filterTier, setFilterTier] = useState<EdgeTier | 'all'>('all');
  const [filterMarket, setFilterMarket] = useState<MarketType | 'all'>('all');

  const handleScan = () => {
    onScan({ tour, live: false, filterTier, filterMarket });
  };

  return (
    <div className="surface-card p-5 mb-6">
      {/* Section label */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
          Scan Configuration
        </span>
        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Data via DataGolf + 13 sportsbooks
        </span>
      </div>

      {/* Controls grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {/* Tour */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Tour</label>
          <select
            value={tour}
            onChange={(e) => setTour(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm font-mono transition-colors"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <option value="pga">PGA Tour</option>
            <option value="euro">DP World Tour</option>
            <option value="kft">Korn Ferry</option>
            <option value="alt">LIV Golf</option>
          </select>
        </div>

        {/* Min Tier */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Min. Tier</label>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as EdgeTier | 'all')}
            className="w-full rounded-lg px-3 py-2 text-sm font-mono transition-colors"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Tiers</option>
            <option value="strong">Strong Only</option>
            <option value="playable">Playable+</option>
            <option value="monitor">Monitor+</option>
          </select>
        </div>

        {/* Market */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Market</label>
          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value as MarketType | 'all')}
            className="w-full rounded-lg px-3 py-2 text-sm font-mono transition-colors"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Markets</option>
            <option value="win">Outright Win</option>
            <option value="top_5">Top 5</option>
            <option value="top_10">Top 10</option>
            <option value="top_20">Top 20</option>
            <option value="make_cut">Make Cut</option>
          </select>
        </div>

        {/* Bankroll */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Bankroll</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => onBankrollChange(Number(e.target.value) || 0)}
              className="w-full rounded-lg pl-7 pr-3 py-2 text-sm font-mono transition-colors"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              min={0}
              step={100}
            />
          </div>
        </div>

        {/* Scan Button - spans 2 cols on mobile */}
        <div className="col-span-2 flex items-end">
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all"
            style={{
              background: isLoading ? 'var(--bg-elevated)' : 'var(--accent-green)',
              color: isLoading ? 'var(--text-muted)' : '#0a0f14',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning Markets...
              </span>
            ) : (
              'Run Edge Scan'
            )}
          </button>
        </div>
      </div>

      {/* Microcopy */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
        Compares DataGolf&apos;s simulation model against implied probabilities from 13 tracked sportsbooks. Edges represent discrepancies where the model assigns higher probability than market pricing.
      </p>
    </div>
  );
}
