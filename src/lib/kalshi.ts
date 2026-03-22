import { KalshiMarket, KalshiEvent } from '@/types';

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

/**
 * Fetch golf-related events from Kalshi
 * No auth needed for public market data
 */
export async function getGolfEvents(): Promise<KalshiEvent[]> {
  try {
    // Search for golf-related events
    const res = await fetch(
      `${KALSHI_BASE}/events?status=open&series_ticker=&limit=100&with_nested_markets=true`,
      {
        next: { revalidate: 300 }, // 5 min cache
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!res.ok) {
      console.error(`Kalshi events API: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const events = data.events || [];

    // Filter for golf events by checking title/category
    const golfEvents = events.filter((e: Record<string, unknown>) => {
      const title = ((e.title as string) || '').toLowerCase();
      const category = ((e.category as string) || '').toLowerCase();
      return (
        category.includes('golf') ||
        title.includes('golf') ||
        title.includes('pga') ||
        title.includes('masters') ||
        title.includes('open championship') ||
        title.includes('us open golf') ||
        title.includes('pga championship') ||
        title.includes('arnold palmer') ||
        title.includes('players championship') ||
        title.includes('invitational') ||
        title.includes('wm phoenix')
      );
    });

    return golfEvents.map(parseKalshiEvent);
  } catch (err) {
    console.error('Kalshi fetch error:', err);
    return [];
  }
}

/**
 * Fetch markets for a specific event
 */
export async function getEventMarkets(eventTicker: string): Promise<KalshiMarket[]> {
  try {
    const res = await fetch(
      `${KALSHI_BASE}/markets?event_ticker=${eventTicker}&limit=200`,
      {
        next: { revalidate: 120 }, // 2 min during live
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.markets || []).map(parseKalshiMarket);
  } catch (err) {
    console.error('Kalshi markets fetch error:', err);
    return [];
  }
}

/**
 * Search all markets by query term (useful for finding specific golfers)
 */
export async function searchMarkets(query: string): Promise<KalshiMarket[]> {
  try {
    const res = await fetch(
      `${KALSHI_BASE}/markets?status=open&limit=100`,
      {
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    const markets = (data.markets || [])
      .filter((m: Record<string, unknown>) => {
        const title = ((m.title as string) || '').toLowerCase();
        const subtitle = ((m.subtitle as string) || '').toLowerCase();
        return title.includes(query.toLowerCase()) || subtitle.includes(query.toLowerCase());
      })
      .map(parseKalshiMarket);

    return markets;
  } catch (err) {
    console.error('Kalshi search error:', err);
    return [];
  }
}

/**
 * Get orderbook depth for a market (indicates liquidity)
 */
export async function getOrderbook(ticker: string): Promise<{
  yes_bids: [number, number][];
  no_bids: [number, number][];
}> {
  try {
    const res = await fetch(`${KALSHI_BASE}/markets/${ticker}/orderbook`, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return { yes_bids: [], no_bids: [] };
    const data = await res.json();

    return {
      yes_bids: data.orderbook_fp?.yes_dollars || [],
      no_bids: data.orderbook_fp?.no_dollars || [],
    };
  } catch {
    return { yes_bids: [], no_bids: [] };
  }
}

// ─── Parsers ──────────────────────────────────────────────────

function parseKalshiEvent(raw: Record<string, unknown>): KalshiEvent {
  const markets = Array.isArray(raw.markets)
    ? raw.markets.map((m: Record<string, unknown>) => parseKalshiMarket(m))
    : [];

  return {
    event_ticker: (raw.event_ticker as string) || '',
    title: (raw.title as string) || '',
    category: (raw.category as string) || '',
    markets,
  };
}

function parseKalshiMarket(raw: Record<string, unknown>): KalshiMarket {
  return {
    ticker: (raw.ticker as string) || '',
    title: (raw.title as string) || '',
    event_ticker: (raw.event_ticker as string) || '',
    subtitle: (raw.subtitle as string) || undefined,
    yes_bid: (raw.yes_bid as number) || 0,
    yes_ask: (raw.yes_ask as number) || 0,
    no_bid: (raw.no_bid as number) || 0,
    no_ask: (raw.no_ask as number) || 0,
    last_price: (raw.last_price as number) || 0,
    volume: (raw.volume as number) || 0,
    open_interest: (raw.open_interest as number) || 0,
    status: (raw.status as string) || 'unknown',
    close_time: (raw.close_time as string) || '',
    result: (raw.result as string) || undefined,
  };
}

// ─── Player Name Matching ─────────────────────────────────────

/**
 * Fuzzy match a DataGolf player name to a Kalshi market title
 * Handles "Scheffler, Scottie" vs "Scottie Scheffler" etc.
 */
export function matchPlayerToMarket(
  dgName: string,
  markets: KalshiMarket[]
): KalshiMarket | null {
  // Normalize DG name: "Scottie Scheffler" or "Scheffler, Scottie"
  const normalized = normalizeName(dgName);
  const parts = normalized.split(' ');
  const lastName = parts[parts.length - 1];
  const firstName = parts[0];

  for (const market of markets) {
    const marketTitle = (market.title + ' ' + (market.subtitle || '')).toLowerCase();

    // Exact full name match
    if (marketTitle.includes(normalized)) return market;

    // Try "Last, First" format
    if (marketTitle.includes(`${lastName}, ${firstName}`)) return market;
    if (marketTitle.includes(`${lastName} ${firstName}`)) return market;

    // Last name only if unique enough (>5 chars)
    if (lastName.length > 5 && marketTitle.includes(lastName)) {
      // Verify first initial too
      if (marketTitle.includes(firstName[0] + '.') || marketTitle.includes(firstName)) {
        return market;
      }
    }
  }

  return null;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .join(' ');
}
