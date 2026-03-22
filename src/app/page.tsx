'use client';

import { useState, useCallback } from 'react';
import { TournamentEdgeScan, EdgeTier, MarketType } from '@/types';
import EdgeCard from '@/components/EdgeCard';
import StatsHeader from '@/components/StatsHeader';
import ControlsBar, { ScanOptions } from '@/components/ControlsBar';
import { getDemoScan } from '@/lib/demo-data';

export default function Dashboard() {
  const [scan, setScan] = useState<TournamentEdgeScan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [bankroll, setBankroll] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Active filters (applied client-side after fetch)
  const [activeTierFilter, setActiveTierFilter] = useState<EdgeTier | 'all'>('all');
  const [activeMarketFilter, setActiveMarketFilter] = useState<MarketType | 'all'>('all');

  const handleScan = useCallback(async (options: ScanOptions) => {
    setIsLoading(true);
    setError(null);
    setIsDemo(false);
    setActiveTierFilter(options.filterTier);
    setActiveMarketFilter(options.filterMarket);

    try {
      const params = new URLSearchParams({
        tour: options.tour,
        live: String(options.live),
      });

      const res = await fetch(`/api/scan?${params}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Scan failed');
      }

      setScan(data.data);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      setError(msg);

      // If API fails (no keys yet), load demo data so UI is still usable
      if (msg.includes('API') || msg.includes('not set') || msg.includes('fetch')) {
        const demo = getDemoScan();
        setScan(demo);
        setIsDemo(true);
        setLastRefresh(new Date().toISOString());
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDemo = useCallback(() => {
    const demo = getDemoScan();
    setScan(demo);
    setIsDemo(true);
    setLastRefresh(new Date().toISOString());
    setError(null);
  }, []);

  // Apply client-side filters
  const filteredEdges = scan?.edges.filter((e) => {
    const tierOrder: Record<EdgeTier | 'all', number> = { all: 99, strong: 0, playable: 1, monitor: 2, none: 3 };
    const passesTier = activeTierFilter === 'all' || tierOrder[e.tier] <= tierOrder[activeTierFilter];
    const passesMarket = activeMarketFilter === 'all' || e.market_type === activeMarketFilter;
    return passesTier && passesMarket;
  }) || [];

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10 max-w-6xl mx-auto">
      {/* Top Bar */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-600/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Golf Edge Finder</h1>
            <p className="text-[11px] text-slate-500 tracking-wide">DataGolf Model vs Robinhood Markets</p>
          </div>
        </div>

        {!scan && (
          <button
            onClick={loadDemo}
            className="text-xs text-slate-500 hover:text-slate-300 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
          >
            Load Demo Data
          </button>
        )}
      </header>

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <span className="text-amber-400 text-lg leading-none mt-0.5">⚠</span>
          <div>
            <p className="text-sm text-amber-200 font-medium">Demo Mode</p>
            <p className="text-xs text-amber-200/60 mt-0.5">
              Showing sample data. Add your DATAGOLF_API_KEY to .env.local and ensure Kalshi markets are available to get live edges.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Controls */}
      <ControlsBar
        onScan={handleScan}
        isLoading={isLoading}
        bankroll={bankroll}
        onBankrollChange={setBankroll}
      />

      {/* Stats */}
      <StatsHeader scan={scan} isLoading={isLoading} lastRefresh={lastRefresh} />

      {/* Edge Cards */}
      {filteredEdges.length > 0 && (
        <div className="space-y-3">
          {/* Section Dividers */}
          {filteredEdges.some(e => e.tier === 'strong') && (
            <div className="flex items-center gap-3 pt-2 pb-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-green-500 font-semibold">Strong Edges</span>
              <div className="flex-1 h-px bg-green-500/10" />
            </div>
          )}
          {filteredEdges
            .filter(e => e.tier === 'strong')
            .map((edge, i) => (
              <EdgeCard key={edge.id} edge={edge} index={i} bankroll={bankroll} />
            ))
          }

          {filteredEdges.some(e => e.tier === 'playable') && (
            <div className="flex items-center gap-3 pt-4 pb-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-500 font-semibold">Playable Edges</span>
              <div className="flex-1 h-px bg-yellow-500/10" />
            </div>
          )}
          {filteredEdges
            .filter(e => e.tier === 'playable')
            .map((edge, i) => (
              <EdgeCard key={edge.id} edge={edge} index={i} bankroll={bankroll} />
            ))
          }

          {filteredEdges.some(e => e.tier === 'monitor') && (
            <div className="flex items-center gap-3 pt-4 pb-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Monitor</span>
              <div className="flex-1 h-px bg-slate-600/10" />
            </div>
          )}
          {filteredEdges
            .filter(e => e.tier === 'monitor')
            .map((edge, i) => (
              <EdgeCard key={edge.id} edge={edge} index={i} bankroll={bankroll} />
            ))
          }
        </div>
      )}

      {/* Empty State */}
      {scan && filteredEdges.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3 opacity-30">⛳</div>
          <p className="text-slate-400 font-display text-xl mb-1">No edges found</p>
          <p className="text-slate-600 text-sm">
            {activeTierFilter !== 'all' || activeMarketFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'The model and market are aligned — check back during the tournament'
            }
          </p>
        </div>
      )}

      {/* Initial Empty State */}
      {!scan && !isLoading && !error && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🏌️</div>
          <p className="font-display text-2xl text-slate-400 mb-2">Ready to find edges</p>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Hit &ldquo;Scan for Edges&rdquo; to compare DataGolf&apos;s model probabilities against Robinhood/Kalshi contract prices and surface actionable discrepancies.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center">
        <div className="text-[10px] text-slate-700 space-y-1">
          <p>Model data via DataGolf • Market data via Kalshi Exchange</p>
          <p>Edge calculations are informational only. Trade responsibly.</p>
        </div>
      </footer>
    </main>
  );
}
