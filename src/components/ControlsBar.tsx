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

  const handleScan = () => onScan({ tour, live: false, filterTier, filterMarket });

  return (
    <div className="card px-5 py-5 mb-6" id="scanner">
      {/* Two-row layout: config row + action row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 mb-4">
        <div>
          <label className="label">Tour</label>
          <select value={tour} onChange={(e) => setTour(e.target.value)} className="input-field">
            <option value="pga">PGA Tour</option>
            <option value="euro">DP World Tour</option>
            <option value="kft">Korn Ferry Tour</option>
            <option value="alt">LIV Golf</option>
          </select>
        </div>
        <div>
          <label className="label">Finish Position</label>
          <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value as MarketType | 'all')} className="input-field">
            <option value="all">All positions</option>
            <option value="win">Winner</option>
            <option value="top_5">Top 5 finish</option>
            <option value="top_10">Top 10 finish</option>
            <option value="top_20">Top 20 finish</option>
            <option value="make_cut">Make the cut</option>
          </select>
        </div>
        <div>
          <label className="label">Edge Quality</label>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value as EdgeTier | 'all')} className="input-field">
            <option value="all">Show all</option>
            <option value="strong">Strong edges only</option>
            <option value="playable">Playable and above</option>
            <option value="monitor">Include watchlist</option>
          </select>
        </div>
        <div>
          <label className="label">Your Bankroll</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>$</span>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => onBankrollChange(Number(e.target.value) || 0)}
              className="input-field"
              style={{ paddingLeft: 24 }}
              min={0}
              step={100}
            />
          </div>
        </div>
      </div>

      {/* Action row */}
      <button
        onClick={handleScan}
        disabled={isLoading}
        className="w-full py-3 rounded-lg text-sm font-semibold tracking-wide transition-all"
        style={{
          background: isLoading ? 'var(--bg-elevated)' : 'var(--accent)',
          color: isLoading ? 'var(--text-muted)' : 'var(--bg-root)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing {tour === 'pga' ? 'PGA' : tour === 'euro' ? 'DP World' : tour === 'kft' ? 'Korn Ferry' : 'LIV'} markets...
          </span>
        ) : (
          'Scan for Edges'
        )}
      </button>
    </div>
  );
}
