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
  const [activeTierFilter, setActiveTierFilter] = useState<EdgeTier | 'all'>('all');
  const [activeMarketFilter, setActiveMarketFilter] = useState<MarketType | 'all'>('all');

  const handleScan = useCallback(async (options: ScanOptions) => {
    setIsLoading(true);
    setError(null);
    setIsDemo(false);
    setActiveTierFilter(options.filterTier);
    setActiveMarketFilter(options.filterMarket);

    try {
      const params = new URLSearchParams({ tour: options.tour, live: String(options.live) });
      const res = await fetch(`/api/scan?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Scan failed');
      setScan(data.data);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      setError(msg);
      if (msg.includes('API') || msg.includes('not set') || msg.includes('fetch')) {
        setScan(getDemoScan());
        setIsDemo(true);
        setLastRefresh(new Date().toISOString());
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDemo = useCallback(() => {
    setScan(getDemoScan());
    setIsDemo(true);
    setLastRefresh(new Date().toISOString());
  }, []);

  const filteredEdges = scan?.edges.filter((e) => {
    const tierOrder: Record<EdgeTier | 'all', number> = { all: 99, strong: 0, playable: 1, monitor: 2, none: 3 };
    return (activeTierFilter === 'all' || tierOrder[e.tier] <= tierOrder[activeTierFilter])
      && (activeMarketFilter === 'all' || e.market_type === activeMarketFilter);
  }) || [];

  const strongEdges = filteredEdges.filter(e => e.tier === 'strong');
  const playableEdges = filteredEdges.filter(e => e.tier === 'playable');
  const monitorEdges = filteredEdges.filter(e => e.tier === 'monitor');

  return (
    <main className="min-h-screen">
      {/* ─── HEADER ─── */}
      <header className="px-5 md:px-10 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-green-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Golf Edge Finder
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!scan && (
            <button onClick={loadDemo} className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
              Preview Demo
            </button>
          )}
          <div className="px-2.5 py-1 rounded-md text-xs font-medium"
            style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
            Beta
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 md:px-10 py-8">

        {/* ─── HERO ─── */}
        {!scan && !isLoading && (
          <div className="animate-fade-in">
            <div className="mb-10">
              <h1 className="font-display text-3xl md:text-4xl mb-3" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Find where the model<br />disagrees with the market.
              </h1>
              <p className="text-base max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Compare simulation-based probabilities against live sportsbook pricing across PGA, European, Korn Ferry, and LIV tours. Surface potential value with disciplined, data-driven edge detection.
              </p>
            </div>

            {/* ─── HOW IT WORKS ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                {
                  step: '01',
                  title: 'Model Probability',
                  desc: 'DataGolf simulates each tournament 60,000 times using historical strokes-gained data, course fit, and player variance to produce finish probabilities.',
                },
                {
                  step: '02',
                  title: 'Market Pricing',
                  desc: 'Implied probabilities are extracted from odds across 13 sportsbooks including Pinnacle, DraftKings, FanDuel, and bet365.',
                },
                {
                  step: '03',
                  title: 'Edge Detection',
                  desc: 'When the model assigns a meaningfully higher probability than a sportsbook, that discrepancy is flagged and sized using the Kelly Criterion.',
                },
              ].map((item) => (
                <div key={item.step} className="surface-card p-5">
                  <div className="font-mono text-xs font-semibold mb-2" style={{ color: 'var(--accent-green)' }}>{item.step}</div>
                  <div className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── DEMO BANNER ─── */}
        {isDemo && (
          <div className="rounded-lg px-4 py-3 mb-5 flex items-start gap-3 animate-fade-in"
            style={{ background: 'var(--accent-amber-muted)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <span style={{ color: 'var(--accent-amber)' }} className="text-sm mt-0.5">&#9432;</span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--accent-amber)' }}>Sample Data</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>
                Displaying illustrative data. Connect your DataGolf API key to scan live markets.
              </p>
            </div>
          </div>
        )}

        {/* ─── ERROR ─── */}
        {error && (
          <div className="rounded-lg px-4 py-3 mb-5" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
            <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>
          </div>
        )}

        {/* ─── CONTROLS ─── */}
        <ControlsBar onScan={handleScan} isLoading={isLoading} bankroll={bankroll} onBankrollChange={setBankroll} />

        {/* ─── STATS ─── */}
        <StatsHeader scan={scan} isLoading={isLoading} lastRefresh={lastRefresh} />

        {/* ─── RESULTS ─── */}
        {filteredEdges.length > 0 && (
          <div className="animate-fade-in delay-2">
            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Results
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                {filteredEdges.length} edge{filteredEdges.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {/* Strong section */}
            {strongEdges.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-green)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-green)' }}>
                    Strong ({strongEdges.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {strongEdges.map((edge, i) => (
                    <EdgeCard key={edge.id} edge={edge} index={i} bankroll={bankroll} />
                  ))}
                </div>
              </div>
            )}

            {/* Playable section */}
            {playableEdges.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-amber)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-amber)' }}>
                    Playable ({playableEdges.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {playableEdges.map((edge, i) => (
                    <EdgeCard key={edge.id} edge={edge} index={i} bankroll={bankroll} />
                  ))}
                </div>
              </div>
            )}

            {/* Monitor section */}
            {monitorEdges.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-faint)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                    Monitor ({monitorEdges.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {monitorEdges.map((edge, i) => (
                    <EdgeCard key={edge.id} edge={edge} index={i} bankroll={bankroll} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── NO RESULTS ─── */}
        {scan && filteredEdges.length === 0 && !isLoading && (
          <div className="text-center py-16 animate-fade-in">
            <p className="font-display text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>No edges match your filters</p>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              {activeTierFilter !== 'all' || activeMarketFilter !== 'all'
                ? 'Try broadening your tier or market selection.'
                : 'Model and market probabilities are closely aligned for this event.'}
            </p>
          </div>
        )}

        {/* ─── METHODOLOGY ─── */}
        {scan && filteredEdges.length > 0 && (
          <div className="surface-card p-5 mt-8 animate-fade-in delay-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Methodology
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Model source:</span> DataGolf&apos;s baseline + course history + course fit model. Probabilities are derived from 60,000 tournament simulations using strokes-gained regression, recency-weighted player performance, and course-specific variance adjustments.
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Edge sizing:</span> Quarter-Kelly is the default to manage variance. Maximum 5% of bankroll on any single edge, 15% total across all concurrent positions. Only edges above configurable thresholds are surfaced.
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Tracked books:</span> bet365, Betcris, BetOnline, BetMGM, Betway, Bovada, Caesars, DraftKings, FanDuel, Pinnacle, PointsBet, Unibet, Sky Bet. The largest edge per player per market is displayed.
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Limitations:</span> Model probabilities are estimates, not certainties. Edges can exist due to model error, not just market inefficiency. This tool is for analytical comparison only and does not constitute financial advice.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="px-5 md:px-10 py-6 mt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Golf Edge Finder &middot; Model data via DataGolf &middot; Market data via sportsbook feeds
          </div>
          <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
            For informational and analytical purposes only. Not financial advice.
          </div>
        </div>
      </footer>
    </main>
  );
}
