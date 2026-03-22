import { NextRequest, NextResponse } from 'next/server';
import { sendEdgeAlerts } from '@/lib/notify';
import { MarketType, EdgeOpportunity, EdgeTier, TournamentEdgeScan } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DG = 'https://feeds.datagolf.com';

const LABELS: Record<MarketType, string> = {
  win: 'Winner', top_5: 'Top 5', top_10: 'Top 10', top_20: 'Top 20', make_cut: 'Make Cut',
};

// Thresholds in percentage points
const STRONG: Record<MarketType, number> = { win: 3.0, top_5: 3.0, top_10: 2.5, top_20: 2.5, make_cut: 3.0 };
const PLAYABLE: Record<MarketType, number> = { win: 1.5, top_5: 1.5, top_10: 1.2, top_20: 1.2, make_cut: 1.5 };

function kelly(p: number, q: number): number {
  if (q <= 0 || q >= 1 || p <= 0) return 0;
  const b = (1 - q) / q;
  return Math.max(0, (b * p - (1 - p)) / b);
}

function tier(edge: number, mkt: MarketType): EdgeTier {
  if (edge >= STRONG[mkt]) return 'strong';
  if (edge >= PLAYABLE[mkt]) return 'playable';
  if (edge > 0.5) return 'monitor';
  return 'none';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = searchParams.get('tour') || 'pga';
    const notify = searchParams.get('notify') === 'true';
    const key = process.env.DATAGOLF_API_KEY;
    if (!key) throw new Error('DATAGOLF_API_KEY not set');

    const mkts: MarketType[] = ['win', 'top_5', 'top_10', 'top_20', 'make_cut'];
    const all: EdgeOpportunity[] = [];
    let event = '';

    for (const mkt of mkts) {
      try {
        const r = await fetch(`${DG}/betting-tools/outrights?tour=${tour}&market=${mkt}&odds_format=percent&file_format=json&key=${key}`);
        if (!r.ok) continue;
        const d = await r.json();
        event = d.event_name || event;
        const books: string[] = d.books_offering || [];
        const odds = d.odds;
        if (!Array.isArray(odds)) continue;

        for (const p of odds) {
          const model = p.datagolf?.baseline_history_fit ?? p.datagolf?.baseline ?? 0;
          if (!model || model <= 0) continue;

          for (const bk of books) {
            const imp = p[bk];
            if (!imp || imp <= 0) continue;
            const edgePts = (model - imp) * 100;
            if (edgePts <= 0) continue;

            const t = tier(edgePts, mkt);
            if (t === 'none') continue;

            const k = kelly(model, imp);

            all.push({
              id: `${p.dg_id}-${mkt}-${bk}-${Date.now()}`,
              player_name: p.player_name || '',
              player_id: p.dg_id || 0,
              market_type: mkt,
              market_label: LABELS[mkt],
              model_prob: Math.round(model * 10000) / 100,
              market_prob: Math.round(imp * 10000) / 100,
              edge: Math.round(edgePts * 100) / 100,
              edge_pct: imp > 0 ? Math.round((edgePts / (imp * 100)) * 10000) / 100 : 0,
              kelly_fraction: Math.round(k * 10000) / 10000,
              half_kelly: Math.round(k * 5000) / 10000,
              quarter_kelly: Math.round(k * 2500) / 10000,
              contract_price: Math.round(imp * 100),
              payout: 100,
              expected_value: Math.round(edgePts * 100) / 100,
              volume: 0,
              open_interest: 0,
              liquidity_grade: 'B',
              tier: t,
              is_live: false,
              timestamp: new Date().toISOString(),
              kalshi_ticker: bk,
            });
          }
        }
      } catch (e) {
        console.error(`${mkt}:`, e);
      }
    }

    // Best edge per player per market
    const best = new Map<string, EdgeOpportunity>();
    for (const e of all) {
      const k = `${e.player_id}-${e.market_type}`;
      if (!best.has(k) || e.edge > best.get(k)!.edge) best.set(k, e);
    }

    const edges = Array.from(best.values());
    const tr: Record<EdgeTier, number> = { strong: 0, playable: 1, monitor: 2, none: 3 };
    edges.sort((a, b) => tr[a.tier] !== tr[b.tier] ? tr[a.tier] - tr[b.tier] : b.edge - a.edge);

    const scan: TournamentEdgeScan = {
      tournament: event,
      course: '',
      scan_time: new Date().toISOString(),
      is_live: false,
      model_type: 'baseline_history_fit',
      edges,
      strong_count: edges.filter(e => e.tier === 'strong').length,
      playable_count: edges.filter(e => e.tier === 'playable').length,
      total_scanned: all.length,
    };

    if (notify && (scan.strong_count > 0 || scan.playable_count > 0)) {
      await sendEdgeAlerts(scan.edges, 'playable');
    }

    return NextResponse.json({ success: true, data: scan });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
