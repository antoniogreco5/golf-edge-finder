'use client';

import { useState, useCallback } from 'react';
import { TournamentEdgeScan, EdgeTier, MarketType } from '@/types';
import EdgeCard from '@/components/EdgeCard';
import StatsHeader from '@/components/StatsHeader';
import ControlsBar, { ScanOptions } from '@/components/ControlsBar';
import { getDemoScan } from '@/lib/demo-data';

export default function Page() {
  const [scan, setScan] = useState<TournamentEdgeScan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [bankroll, setBankroll] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [tierFilter, setTierFilter] = useState<EdgeTier | 'all'>('all');
  const [marketFilter, setMarketFilter] = useState<MarketType | 'all'>('all');

  const runScan = useCallback(async (opts: ScanOptions) => {
    setIsLoading(true);
    setError(null);
    setIsDemo(false);
    setTierFilter(opts.filterTier);
    setMarketFilter(opts.filterMarket);
    try {
      const res = await fetch(`/api/scan?tour=${opts.tour}&live=${opts.live}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Scan failed');
      setScan(data.data);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      setError(msg);
      if (msg.includes('API') || msg.includes('not set')) {
        setScan(getDemoScan());
        setIsDemo(true);
        setLastRefresh(new Date().toISOString());
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showExample = useCallback(() => {
    setScan(getDemoScan());
    setIsDemo(true);
    setLastRefresh(new Date().toISOString());
  }, []);

  const tierRank: Record<EdgeTier | 'all', number> = { all: 99, strong: 0, playable: 1, monitor: 2, none: 3 };
  const filtered = scan?.edges.filter(e =>
    (tierFilter === 'all' || tierRank[e.tier] <= tierRank[tierFilter]) &&
    (marketFilter === 'all' || e.market_type === marketFilter)
  ) || [];

  const strong = filtered.filter(e => e.tier === 'strong');
  const playable = filtered.filter(e => e.tier === 'playable');
  const monitor = filtered.filter(e => e.tier === 'monitor');
  const hasScan = !!scan;
  const hasResults = filtered.length > 0;

  return (
    <main className="min-h-screen flex flex-col">

      {/* ════════ HEADER ════════ */}
      <header className="px-5 md:px-10 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Golf Edge Finder
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            BETA
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!hasScan && (
            <button onClick={showExample} className="text-xs px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              See Example Results
            </button>
          )}
          {/* Future: Sign In button */}
          <button className="text-xs px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            Sign In
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-5 md:px-10 py-8">

        {/* ════════ HERO (pre-scan) ════════ */}
        {!hasScan && !isLoading && (
          <div className="enter">
            {/* Headline */}
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-[2.6rem] leading-[1.15] mb-3" style={{ color: 'var(--text-primary)' }}>
                Spot mispriced golfers<br className="hidden md:block" /> before the market corrects.
              </h1>
              <p className="text-base max-w-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We compare a 60,000-simulation predictive model against real-time sportsbook odds to surface golf betting edges you can act on — sized with the Kelly Criterion so you never overbet.
              </p>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-10 pb-8" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {[
                'DataGolf predictive model',
                '13 sportsbooks tracked',
                'Kelly Criterion sizing',
                'Updated each tournament',
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t}</span>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="mb-10">
              <h2 className="section-label mb-4">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { n: '1', title: 'Model estimates probability', body: 'DataGolf simulates the tournament 60,000 times using strokes-gained data, course fit, and historical performance to estimate each player\u2019s chance of finishing in various positions.' },
                  { n: '2', title: 'Books set their prices', body: 'We pull implied probabilities from 13 major sportsbooks — including Pinnacle, DraftKings, and FanDuel — and compare them against the model\u2019s output.' },
                  { n: '3', title: 'We flag the discrepancy', body: 'When the model believes a player is more likely to hit a position than any sportsbook does, that gap is your potential edge. We size it conservatively using quarter-Kelly.' },
                ].map((s) => (
                  <div key={s.n} className="card p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>{s.n}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════ DEMO NOTICE ════════ */}
        {isDemo && (
          <div className="rounded-lg px-4 py-3 mb-5 enter" style={{ background: 'var(--amber-muted)', border: '1px solid rgba(245,197,66,0.12)' }}>
            <p className="text-sm" style={{ color: 'var(--amber)' }}>
              <span className="font-semibold">Example results.</span>{' '}
              <span style={{ opacity: 0.7 }}>This is sample data to show how edges are presented. Run a live scan to see real-time opportunities.</span>
            </p>
          </div>
        )}

        {/* ════════ ERROR ════════ */}
        {error && (
          <div className="rounded-lg px-4 py-3 mb-5" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)' }}>
            <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        {/* ════════ CONTROLS ════════ */}
        <ControlsBar onScan={runScan} isLoading={isLoading} bankroll={bankroll} onBankrollChange={setBankroll} />

        {/* ════════ STATS ════════ */}
        <StatsHeader scan={scan} isLoading={isLoading} lastRefresh={lastRefresh} />

        {/* ════════ RESULTS ════════ */}
        {hasResults && (
          <div className="enter enter-d2">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label">Results</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                {filtered.length} edge{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {strong.length > 0 && (
              <EdgeSection label="Strong edges" color="var(--accent)" count={strong.length}>
                {strong.map((e, i) => <EdgeCard key={e.id} edge={e} index={i} bankroll={bankroll} />)}
              </EdgeSection>
            )}

            {playable.length > 0 && (
              <EdgeSection label="Playable edges" color="var(--amber)" count={playable.length}>
                {playable.map((e, i) => <EdgeCard key={e.id} edge={e} index={i} bankroll={bankroll} />)}
              </EdgeSection>
            )}

            {monitor.length > 0 && (
              <EdgeSection label="Watchlist" color="var(--text-faint)" count={monitor.length}>
                {monitor.map((e, i) => <EdgeCard key={e.id} edge={e} index={i} bankroll={bankroll} />)}
              </EdgeSection>
            )}
          </div>
        )}

        {/* ════════ NO RESULTS ════════ */}
        {hasScan && !hasResults && !isLoading && (
          <div className="text-center py-14 enter">
            <p className="font-display text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
              No edges found{tierFilter !== 'all' || marketFilter !== 'all' ? ' for these filters' : ''}
            </p>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-faint)' }}>
              {tierFilter !== 'all' || marketFilter !== 'all'
                ? 'Try broadening your finish position or edge quality settings above.'
                : 'The model and sportsbook probabilities are closely aligned for this event. This is normal — not every week produces actionable edges.'}
            </p>
          </div>
        )}

        {/* ════════ ABOUT THIS TOOL (always visible after results) ════════ */}
        {hasScan && (
          <div className="card p-5 mt-10 enter enter-d4">
            <h3 className="section-label mb-4">About this analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>What is an &ldquo;edge&rdquo;?</span>{' '}
                An edge appears when the predictive model assigns a player a higher probability for a finish position than a sportsbook does.
                A +4.0 pt edge on &ldquo;Top 20&rdquo; means the model thinks the player is 4 percentage points more likely to finish Top 20 than the book&rsquo;s price implies.
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>How is bet sizing calculated?</span>{' '}
                We use quarter-Kelly by default — a conservative fraction of the mathematically optimal bet size.
                No single edge exceeds 5% of your bankroll, and total exposure is capped at 15%.
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Model &amp; data sources</span>{' '}
                Probabilities come from DataGolf&rsquo;s simulation model (60k iterations, strokes-gained regression, course history &amp; fit adjustments).
                Market odds from 13 tracked sportsbooks. The best available edge per player per market is shown.
              </div>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Important limitations</span>{' '}
                Model probabilities are estimates derived from historical data. Edges may reflect model error rather than market inefficiency.
                This tool is for analytical comparison and does not constitute financial or betting advice.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ FOOTER ════════ */}
      <footer className="mt-auto px-5 md:px-10 py-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          <span>Golf Edge Finder &middot; Model data via DataGolf &middot; Market odds via sportsbook feeds</span>
          <span>For informational and analytical purposes only.</span>
        </div>
      </footer>
    </main>
  );
}

/* ─── Section wrapper for edge tier groups ─── */
function EdgeSection({ label, color, count, children }: {
  label: string; color: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
