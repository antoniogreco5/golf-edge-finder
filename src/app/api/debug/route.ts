import { NextRequest, NextResponse } from 'next/server';
import { getPreTournamentPredictions } from '@/lib/datagolf';
import { getGolfEvents, getEventMarkets } from '@/lib/kalshi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  try {
    const dg = await getPreTournamentPredictions('pga');
    results.datagolf = {
      success: true,
      tournament: dg.tournament.event_name,
      player_count: dg.players.length,
      sample_players: dg.players.slice(0, 5).map(p => ({
        name: p.player_name,
        win: p.win,
        top_5: p.top_5,
        top_20: p.top_20,
      })),
    };
  } catch (err) {
    results.datagolf = { success: false, error: err instanceof Error ? err.message : 'Unknown' };
  }

  try {
    const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/events?status=open&limit=200', { headers: { Accept: 'application/json' } });
    const data = await res.json();
    const allEvents = data.events || [];
    const categories = [...new Set(allEvents.map((e: Record<string, unknown>) => e.category))];
    const golfKeywords = ['golf','pga','masters','valspar','arnold palmer','players championship'];
    const golfEvents = allEvents.filter((e: Record<string, unknown>) => {
      const t = ((e.title as string)||'').toLowerCase();
      const c = ((e.category as string)||'').toLowerCase();
      return golfKeywords.some(kw => t.includes(kw) || c.includes(kw));
    });
    const sportsEvents = allEvents.filter((e: Record<string, unknown>) => {
      const c = ((e.category as string)||'').toLowerCase();
      return c.includes('sport') || c.includes('golf');
    });
    results.kalshi = {
      success: true,
      total_events: allEvents.length,
      categories,
      golf_events_found: golfEvents.length,
      golf_events: golfEvents.slice(0,10).map((e: Record<string, unknown>) => ({ ticker: e.event_ticker, title: e.title, category: e.category })),
      sports_sample: sportsEvents.slice(0,5).map((e: Record<string, unknown>) => ({ ticker: e.event_ticker, title: e.title, category: e.category })),
    };
    if (golfEvents.length > 0) {
      const ticker = (golfEvents[0] as Record<string, unknown>).event_ticker as string;
      const markets = await getEventMarkets(ticker);
      results.kalshi_golf_markets = { event: ticker, count: markets.length, sample: markets.slice(0,10).map(m => ({ ticker: m.ticker, title: m.title, last_price: m.last_price, volume: m.volume })) };
    }
  } catch (err) {
    results.kalshi = { success: false, error: err instanceof Error ? err.message : 'Unknown' };
  }

  return NextResponse.json(results);
}
