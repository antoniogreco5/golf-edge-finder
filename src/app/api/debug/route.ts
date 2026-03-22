import { NextRequest, NextResponse } from 'next/server';
import { getPreTournamentPredictions } from '@/lib/datagolf';
import { getGolfEvents, getEventMarkets } from '@/lib/kalshi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  // 1. Test DataGolf
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
        top_10: p.top_10,
        top_20: p.top_20,
      })),
    };
  } catch (err) {
    results.datagolf = {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // 2. Test Kalshi - get ALL open events first
  try {
    const res = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/events?status=open&limit=200',
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();
    const allEvents = data.events || [];

    // Find anything golf-related
    const golfKeywords = ['golf', 'pga', 'masters', 'open championship', 'valspar', 'arnold palmer', 'players championship', 'lpga', 'liv golf'];
    const golfEvents = allEvents.filter((e: Record<string, unknown>) => {
      const title = ((e.title as string) || '').toLowerCase();
      const category = ((e.category as string) || '').toLowerCase();
      return golfKeywords.some(kw => title.includes(kw) || category.includes(kw));
    });

    // Also show all unique categories so we can see what's available
    const categories = [...new Set(allEvents.map((e: Record<string, unknown>) => e.category))];

    // Show any sports events
    const sportsEvents = allEvents.filter((e: Record<string, unknown>) => {
      const category = ((e.category as string) || '').toLowerCase();
      return category.includes('sport') || category.includes('golf') || category.includes('basketball') || category.includes('baseball');
    });

    results.kalshi = {
      success: true,
      total_events: allEvents.length,
      categories: categories,
      golf_events_found: golfEvents.length,
      golf_events: golfEvents.slice(0, 10).map((e: Record<string, unknown>) => ({
        ticker: e.event_ticker,
        title: e.title,
        category: e.category,
        market_count: Array.isArray(e.markets) ? e.markets.length : 'nested not loaded',
      })),
      sports_events_sample: sportsEvents.slice(0, 10).map((e: Record<string, unknown>) => ({
        ticker: e.event_ticker,
        title: e.title,
        category: e.category,
      })),
    };

    // 3. If we found golf events, try loading their markets
    if (golfEvents.length > 0) {
      const firstEvent = golfEvents[0] as Record<string, unknown>;
      const ticker = firstEvent.event_ticker as string;
      const markets = await getEventMarkets(ticker);
      results.kalshi_golf_markets = {
        event: ticker,
        market_count: markets.length,
        sample_markets: markets.slice(0, 10).map(m => ({
          ticker: m.ticker,
          title: m.title,
          subtitle: m.subtitle,
          yes_bid: m.yes_bid,
          yes_ask: m.yes_ask,
          last_price: m.last_price,
          volume: m.volume,
        })),
      };
    }
  } catch (err) {
    results.kalshi = {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  return NextResponse.json(results, { status: 200 });
}
