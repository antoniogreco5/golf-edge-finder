'use client';

import { useState } from 'react';
import { MarketType, EdgeTier } from '@/types';

interface ControlsBarProps {
  onScan: (options: ScanOptions) => void;
  isLoading: boolean;
  bankroll: number;
  onBankrollChange: (v: number) => void;
}

export interface ScanOptions {
  tour: string;
  live: boolean;
  filterTier: EdgeTier | 'all';
  filterMarket: MarketType | 'all';
}

export default function ControlsBar({ onScan, isLoading, bankroll, onBankrollChange }: ControlsBarProps) {
  const [tour, setTour] = useState('pga');
  const [live, setLive] = useState(true);
  const [filterTier, setFilterTier] = useState<EdgeTier | 'all'>('all');
  const [filterMarket, setFilterMarket] = useState<MarketType | 'all'>('all');

  const handleScan = () => {
    onScan({ tour, live, filterTier, filterMarket });
  };

  return (
    <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Tour Select */}
        <div className="flex-shrink-0">
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Tour</label>
          <select
            value={tour}
            onChange={(e) => setTour(e.target.value)}
            className="bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40 font-mono"
          >
            <option value="pga">PGA Tour</option>
            <option value="euro">European Tour</option>
            <option value="kft">Korn Ferry</option>
            <option value="liv">LIV Golf</option>
          </select>
        </div>

        {/* Live Toggle */}
        <div className="flex-shrink-0">
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Mode</label>
          <button
            onClick={() => setLive(!live)}
            className={`px-3 py-2 rounded-lg text-sm font-mono border transition-all ${
              live
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/80 border-white/10 text-slate-400'
            }`}
          >
            {live ? '⚡ Live' : '📋 Pre-Tourney'}
          </button>
        </div>

        {/* Tier Filter */}
        <div className="flex-shrink-0">
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Min Tier</label>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as EdgeTier | 'all')}
            className="bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40 font-mono"
          >
            <option value="all">All</option>
            <option value="strong">Strong Only</option>
            <option value="playable">Playable+</option>
            <option value="monitor">Monitor+</option>
          </select>
        </div>

        {/* Market Type Filter */}
        <div className="flex-shrink-0">
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Market</label>
          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value as MarketType | 'all')}
            className="bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40 font-mono"
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
        <div className="flex-shrink-0">
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Bankroll</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => onBankrollChange(Number(e.target.value) || 0)}
              className="bg-slate-800/80 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40 font-mono w-28"
              min={0}
              step={100}
            />
          </div>
        </div>

        {/* Scan Button */}
        <div className="flex-shrink-0 ml-auto">
          <button
            onClick={handleScan}
            disabled={isLoading}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all
              ${isLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20 hover:shadow-green-500/30'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </span>
            ) : (
              'Scan for Edges'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
