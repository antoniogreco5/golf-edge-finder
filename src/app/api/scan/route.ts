import { NextRequest, NextResponse } from 'next/server';
import { sendEdgeAlerts } from '@/lib/notify';
import { MarketType, EdgeOpportunity, EdgeTier, TournamentEdgeScan, DEFAULT_THRESHOLDS } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DG = 'https://feeds.datagolf.com';
const MARKET_LABELS: Record<MarketType, string> = {
  win: 'Outright Win', top_5: 'Top 5', top_10: 'Top 10', top_20: 'Top 20', make_cut: 'Make Cut',
};

function kellyFraction(p: number, impliedP: number): number {
  if (impliedP <= 0 || impliedP >= 1 || p <= 0) return 0;
  const b = (1 - impliedP) / impliedP;
  const k = (b * p - (1 - p)) / b;
  return Math.max(0, k);
}

function classifyEdge(edge: number, mkt: MarketType): EdgeTier {
  const t = DEFAULT_THRESHOLDS;
  if (edge >= t.strong[mkt]) return 'strong';
  if (edge >= t.playable[mkt]) return 'playable';
  if (edge > 0) return 'monitor';
  return 'none';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = searchParams.get('tour') || 'pga';
    const notify = searchParams.get('notify') === 'true';
    const key = process.env.DATAGOLF_API_KEY;
    if (!key) throw new Error('DATAGOLF_API_KEY not set');

    const marketTypes: MarketType[] = ['win', 'top_5', 'top_10', 'top_20', 'make_cut'];
    const allEdges: EdgeOpportunity[] = [];
    let eventName = '';
    let allBooks: string[] = [];

    for (const mkt of marketTypes) {
      try {
        const res = await fetch(
          `${DG}/betting-tools/outrights?tour=${tour}&market=${mkt}&odds_format=percent&file_format=json&key=${key}`
        );
        if (!res.ok) continue;
        const data = await res.json();
        eventName = data.event_name || eventName;
        const books: string[] = data.books_offering || [];
        allBooks = books;
        const odds = data.odds || [];
        if (!Array.isArray(odds)) continue;

        for (const player of odds) {
          const name: string = player.player_name || '';
          const dgId: number = player.dg_id || 0;
          const dg = player.datagolf || {};
          const modelProb: number = dg.baseline_history_fit || dg.baseline || 0;
          if (!modelProb || modelProb <= 0) continue;
          const modelPct = modelProb * 100;

          for (const book of books) {
            const bookProb: number = player[book];
            if (!bookProb || bookProb <= 0) continue;
            const bookPct = bookProb * 100;
            const rawEdge = modelPct - bookPct;
            if (rawEdge <= 0) continue;

            const kelly = kellyFraction(modelProb, bookProb);
            const tier = classifyEdge(rawEdge, mkt);
            if (tier === 'none') continue;

            allEdges.push({
              id: `${dgId}-${mkt}-${book}-${Date.now()}`,
              player_name: name,
              player_id: dgId,
              market_type: mkt,
              market_label: MARKET_LABELS[mkt],
              model_prob: Math.round(modelPct * 100) / 100,
              market_prob: Math.round(bookPct * 100) / 100,
              edge: Math.round(rawEdge * 100) / 100,
              edge_pct: bookPct > 0 ? Math.round((rawEdge / bookPct) * 10000) / 100 : 0,
              kelly_fraction: Math.round(kelly * 10000) / 10000,
              half_kelly: Math.round(kelly * 0.5 * 10000) / 10000,
              quarter_kelly: Math.round(kelly * 0.25 * 10000) / 10000,
              contract_price: Math.round(bookPct),
              payout: 100,
              expected_value: Math.round(rawEdge * 100) / 100,
              volume: 0,
              open_interest: 0,
              liquidity_grade: 'B' as const,
              tier,
              is_live: false,
              timestamp: new Date().toISOString(),
              kalshi_ticker: book,
            });
          }
        }
      } catch (err) {
        console.error(`Error on ${mkt}:`, err);
      }
    }

    const best = new Map<string, EdgeOpportunity>();
    for (const e of allEdges) {
      const k = `${e.player_id}-${e.market_type}`;
      const ex = best.get(k);
      if (!ex || e.edge > ex.edge) best.set(k, e);
    }

    const edges = Array.from(best.values());
    const tierOrder: Record<EdgeTier, number> = { strong: 0, playable: 1, monitor: 2, none: 3 };
    edges.sort((a, b) => {
      if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
      return b.edge - a.edge;
    });

    const scan: TournamentEdgeScan = {
      tournament: eventName,
      course: '',
      scan_time: new Date().toISOString(),
      is_live: false,
      model_type: 'baseline_history_fit',
      edges,
      strong_count: edges.filter(e => e.tier === 'strong').length,
      playable_count: edges.filter(e => e.tier === 'playable').length,
      total_scanned: allEdges.length,
    };

    if (notify && (scan.strong_count > 0 || scan.playable_count > 0)) {
      await sendEdgeAlerts(scan.edges, 'playable');
    }

    return NextResponse.json({ success: true, data: scan, books: allBooks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
