import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2';

export async function GET() {
  const results: Record<string, unknown> = {};

  // Try multiple approaches to find golf markets on Kalshi
  const seriesTickers = ['GOLFWIN','GOLFT5','GOLFT10','GOLFT20','GOLFH2H','GOLF','KXGOLF','KXPGA'];

  // 1. Search markets directly with series tickers
  for (const ticker of seriesTickers) {
    try {
      const res = await fetch(`${KALSHI}/markets?series_ticker=${ticker}&status=open&limit=10`);
      const data = await res.json();
      if (data.markets && data.markets.length > 0) {
        results[`series_${ticker}`] = {
          count: data.markets.length,
          sample: data.markets.slice(0,5).map((m: Record<string,unknown>) => ({
            ticker: m.ticker, title: m.title, subtitle: m.subtitle,
            yes_bid: m.yes_bid, last_price: m.last_price, volume: m.volume
          }))
        };
      }
    } catch { /* skip */ }
  }

  // 2. Search events with cursor pagination past 200
  try {
    let cursor = '';
    let golfFound: Record<string,unknown>[] = [];
    for (let i = 0; i < 5; i++) {
      const url = `${KALSHI}/events?status=open&limit=200${cursor ? `&cursor=${cursor}` : ''}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      const events = data.events || [];
      const golf = events.filter((e: Record<string,unknown>) => {
        const t = ((e.title as string)||'').toLowerCase();
        const c = ((e.category as string)||'').toLowerCase();
        return t.includes('golf') || t.includes('pga') || t.includes('valspar') || t.includes('masters') || c.includes('golf');
      });
      golfFound = golfFound.concat(golf);
      cursor = data.cursor || '';
      if (!cursor || events.length < 200) break;
    }
    results.paginated_golf_events = {
      found: golfFound.length,
      events: golfFound.slice(0,10).map((e: Record<string,unknown>) => ({
        ticker: e.event_ticker, title: e.title, category: e.category
      }))
    };
  } catch (err) {
    results.paginated_error = err instanceof Error ? err.message : 'error';
  }

  // 3. Try fetching markets directly with text search
  try {
    const res = await fetch(`${KALSHI}/markets?limit=100&status=open`);
    const data = await res.json();
    const markets = data.markets || [];
    const golfMarkets = markets.filter((m: Record<string,unknown>) => {
      const t = ((m.ticker as string)||'').toUpperCase();
      const title = ((m.title as string)||'').toLowerCase();
      return t.includes('GOLF') || title.includes('golf') || title.includes('valspar') || title.includes('pga tour');
    });
    results.market_text_search = {
      total_returned: markets.length,
      golf_found: golfMarkets.length,
      sample: golfMarkets.slice(0,10).map((m: Record<string,unknown>) => ({
        ticker: m.ticker, title: m.title, volume: m.volume, last_price: m.last_price
      }))
    };
  } catch { /* skip */ }

  return NextResponse.json(results);
}
