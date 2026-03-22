import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const DG = 'https://feeds.datagolf.com';

export async function GET() {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) return NextResponse.json({ error: 'No key' });

  const markets = ['win','top_5','top_10','top_20','make_cut','top5','top10','top20','make cut'];
  const results: Record<string, unknown> = {};

  for (const m of markets) {
    try {
      const res = await fetch(
        `${DG}/betting-tools/outrights?tour=pga&market=${encodeURIComponent(m)}&odds_format=percent&file_format=json&key=${key}`
      );
      const raw = await res.text();
      if (res.ok) {
        const data = JSON.parse(raw);
        const odds = data.odds || [];
        // Count edges where model > any book
        let edgeCount = 0;
        let maxEdge = 0;
        let maxEdgePlayer = '';
        if (Array.isArray(odds)) {
          for (const p of odds) {
            const dg = p.datagolf?.baseline_history_fit || 0;
            if (!dg) continue;
            const books = (data.books_offering || []) as string[];
            for (const b of books) {
              const bk = p[b];
              if (!bk || bk <= 0) continue;
              const edge = (dg - bk) * 100;
              if (edge > 0) {
                edgeCount++;
                if (edge > maxEdge) {
                  maxEdge = edge;
                  maxEdgePlayer = p.player_name;
                }
              }
            }
          }
        }
        results[m] = {
          status: res.status,
          players: Array.isArray(odds) ? odds.length : 0,
          edge_count: edgeCount,
          max_edge_pts: Math.round(maxEdge * 100) / 100,
          max_edge_player: maxEdgePlayer,
          sample_player: Array.isArray(odds) && odds[0] ? {
            name: odds[0].player_name,
            model: odds[0].datagolf?.baseline_history_fit,
            pinnacle: odds[0].pinnacle,
            draftkings: odds[0].draftkings,
            fanduel: odds[0].fanduel,
          } : null,
        };
      } else {
        results[m] = { status: res.status, error: raw.substring(0, 200) };
      }
    } catch (err) {
      results[m] = { error: err instanceof Error ? err.message : 'fail' };
    }
  }

  return NextResponse.json(results);
}
