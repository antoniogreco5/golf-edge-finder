import { MarketType } from '@/types';

const DG_BASE = 'https://feeds.datagolf.com';

function getApiKey(): string {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) throw new Error('DATAGOLF_API_KEY not set');
  return key;
}

export interface DGOutrightPlayer {
  dg_id: number;
  player_name: string;
  country: string;
  // Model probabilities (decimal, e.g. 0.08 = 8%)
  baseline_history_fit: Record<string, number>;
  // Sportsbook odds (American format or implied probability)
  books: Record<string, Record<string, number>>;
}

export interface DGOutrightResponse {
  event_name: string;
  last_updated: string;
  market: string;
  books: string[];
  players: DGOutrightPlayer[];
}

/**
 * Fetch outrights from DataGolf Betting Tools
 * Returns model predictions alongside sportsbook odds
 */
export async function getOutrights(
  tour: string = 'pga',
  market: string = 'win',
  oddsFormat: string = 'implied_prob'
): Promise<DGOutrightResponse> {
  const params = new URLSearchParams({
    tour,
    market,
    odds_format: oddsFormat,
    file_format: 'json',
    key: getApiKey(),
  });

  const res = await fetch(`${DG_BASE}/betting-tools/outrights?${params}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataGolf outrights API error: ${res.status} - ${text}`);
  }

  return res.json();
}

/**
 * Fetch pre-tournament predictions
 */
export async function getPreTournamentPredictions(tour: string = 'pga') {
  const params = new URLSearchParams({
    tour,
    dead_heat: 'yes',
    odds_format: 'percent',
    file_format: 'json',
    key: getApiKey(),
  });

  const res = await fetch(`${DG_BASE}/preds/pre-tournament?${params}`, {
    next: { revalidate: 900 },
  });

  if (!res.ok) throw new Error(`DataGolf predictions API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch live in-play predictions
 */
export async function getLivePredictions(tour: string = 'pga') {
  const params = new URLSearchParams({
    tour,
    odds_format: 'percent',
    file_format: 'json',
    key: getApiKey(),
  });

  const res = await fetch(`${DG_BASE}/preds/in-play?${params}`, {
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 400) return null;
    throw new Error(`DataGolf live API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Get list of sportsbooks DataGolf tracks
 */
export async function getTrackedBooks(tour: string = 'pga') {
  const data = await getOutrights(tour, 'win', 'implied_prob');
  return data.books || [];
}

// Market type mapping for DG API
export const DG_MARKET_MAP: Record<MarketType, string> = {
  win: 'win',
  top_5: 'top_5',
  top_10: 'top_10',
  top_20: 'top_20',
  make_cut: 'make_cut',
};
