import {
  DGPlayerPrediction,
  KalshiMarket,
  MarketType,
  EdgeOpportunity,
  EdgeTier,
  EdgeThresholds,
  DEFAULT_THRESHOLDS,
  TournamentEdgeScan,
  DGTournament,
} from '@/types';
import { matchPlayerToMarket } from './kalshi';

const MARKET_TYPES: { key: MarketType; label: string }[] = [
  { key: 'win', label: 'Outright Win' },
  { key: 'top_5', label: 'Top 5' },
  { key: 'top_10', label: 'Top 10' },
  { key: 'top_20', label: 'Top 20' },
  { key: 'make_cut', label: 'Make Cut' },
];

/**
 * Calculate Kelly Criterion fraction for a binary bet
 * f* = (bp - q) / b
 * where b = net odds (payout/stake - 1), p = true prob, q = 1 - p
 */
function kellyFraction(modelProb: number, contractPrice: number): number {
  if (contractPrice <= 0 || contractPrice >= 100 || modelProb <= 0) return 0;

  const p = modelProb / 100;
  const q = 1 - p;
  const b = (100 - contractPrice) / contractPrice; // net odds received

  const kelly = (b * p - q) / b;
  return Math.max(0, kelly); // never negative
}

/**
 * Grade liquidity based on volume and open interest
 */
function gradeLiquidity(volume: number, openInterest: number): 'A' | 'B' | 'C' | 'D' {
  const score = volume * 0.6 + openInterest * 0.4;
  if (score >= 500) return 'A';
  if (score >= 100) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

/**
 * Classify edge into tier
 */
function classifyEdge(
  edge: number,
  marketType: MarketType,
  liquidity: 'A' | 'B' | 'C' | 'D',
  thresholds: EdgeThresholds
): EdgeTier {
  // D-grade liquidity markets are never actionable
  if (liquidity === 'D') return 'none';

  if (edge >= thresholds.strong[marketType]) return 'strong';
  if (edge >= thresholds.playable[marketType]) return 'playable';
  if (edge > 0) return 'monitor';
  return 'none';
}

/**
 * Build edge opportunities for a single player across all market types
 */
function calculatePlayerEdges(
  player: DGPlayerPrediction,
  markets: KalshiMarket[],
  isLive: boolean,
  thresholds: EdgeThresholds
): EdgeOpportunity[] {
  const edges: EdgeOpportunity[] = [];

  for (const { key, label } of MARKET_TYPES) {
    const modelProb = player[key] as number;
    if (!modelProb || modelProb <= 0) continue;

    // Scale to 0-100 if DataGolf returns as decimal
    const modelProbPct = modelProb > 1 ? modelProb : modelProb * 100;

    // Find matching market on Kalshi
    // For now, we try to match by player name + market type
    const matchedMarket = findMarketForPlayer(player.player_name, key, markets);
    if (!matchedMarket) continue;

    // Contract price = implied probability
    // Use yes_ask (what you'd pay to buy YES) for conservative calc
    // Fall back to last_price if ask not available
    const contractPrice = matchedMarket.yes_ask || matchedMarket.last_price;
    if (contractPrice <= 0) continue;

    const marketProbPct = contractPrice; // cents = implied probability %
    const rawEdge = modelProbPct - marketProbPct;

    const volume = matchedMarket.volume;
    const oi = matchedMarket.open_interest;
    const liquidity = gradeLiquidity(volume, oi);

    // Skip below minimum liquidity
    if (volume < thresholds.min_volume && oi < thresholds.min_open_interest) continue;

    const kelly = kellyFraction(modelProbPct, contractPrice);
    const tier = classifyEdge(rawEdge, key, liquidity, thresholds);

    const ev = (modelProbPct / 100) * 100 - contractPrice; // EV per contract in cents

    edges.push({
      id: `${player.dg_id}-${key}-${Date.now()}`,
      player_name: player.player_name,
      player_id: player.dg_id,
      market_type: key,
      market_label: label,
      model_prob: Math.round(modelProbPct * 100) / 100,
      market_prob: marketProbPct,
      edge: Math.round(rawEdge * 100) / 100,
      edge_pct: marketProbPct > 0
        ? Math.round((rawEdge / marketProbPct) * 10000) / 100
        : 0,
      kelly_fraction: Math.round(kelly * 10000) / 10000,
      half_kelly: Math.round(kelly * 0.5 * 10000) / 10000,
      quarter_kelly: Math.round(kelly * 0.25 * 10000) / 10000,
      contract_price: contractPrice,
      payout: 100, // $1.00 in cents
      expected_value: Math.round(ev * 100) / 100,
      volume,
      open_interest: oi,
      liquidity_grade: liquidity,
      tier,
      is_live: isLive,
      timestamp: new Date().toISOString(),
      kalshi_ticker: matchedMarket.ticker,
      kalshi_event_ticker: matchedMarket.event_ticker,
    });
  }

  return edges;
}

/**
 * Find the right Kalshi market for a player + market type combo
 * Market titles often follow patterns like:
 *   "Scottie Scheffler" (for outright win)
 *   "Scottie Scheffler Top 20" (for top 20)
 */
function findMarketForPlayer(
  playerName: string,
  marketType: MarketType,
  markets: KalshiMarket[]
): KalshiMarket | null {
  // Filter markets that might correspond to this market type
  const typeKeywords: Record<MarketType, string[]> = {
    win: ['win', 'winner', 'champion'],
    top_5: ['top 5', 'top five', 'top-5'],
    top_10: ['top 10', 'top ten', 'top-10'],
    top_20: ['top 20', 'top twenty', 'top-20'],
    make_cut: ['make cut', 'make the cut', 'cut'],
  };

  const keywords = typeKeywords[marketType];

  // For outright winner: markets where the title IS the player name
  // For finish positions: markets with both player name and position keyword
  const candidates = markets.filter((m) => {
    const title = (m.title + ' ' + (m.subtitle || '')).toLowerCase();
    const hasPlayer = title.includes(playerName.toLowerCase().split(' ').pop() || '');

    if (marketType === 'win') {
      // Winner markets might just have the player name
      return hasPlayer;
    }

    return hasPlayer && keywords.some((kw) => title.includes(kw));
  });

  if (candidates.length === 0) {
    return matchPlayerToMarket(playerName, markets);
  }

  // Return the best match (highest volume)
  return candidates.sort((a, b) => b.volume - a.volume)[0];
}

/**
 * Run a full edge scan: compare all DG players against all Kalshi markets
 */
export function runEdgeScan(
  tournament: DGTournament,
  players: DGPlayerPrediction[],
  markets: KalshiMarket[],
  isLive: boolean,
  thresholds: EdgeThresholds = DEFAULT_THRESHOLDS
): TournamentEdgeScan {
  const allEdges: EdgeOpportunity[] = [];

  for (const player of players) {
    const playerEdges = calculatePlayerEdges(player, markets, isLive, thresholds);
    allEdges.push(...playerEdges);
  }

  // Sort by edge descending, then by tier
  const tierOrder: Record<EdgeTier, number> = { strong: 0, playable: 1, monitor: 2, none: 3 };
  allEdges.sort((a, b) => {
    if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
    return b.edge - a.edge;
  });

  // Filter out 'none' tier
  const actionableEdges = allEdges.filter((e) => e.tier !== 'none');

  return {
    tournament: tournament.event_name,
    course: tournament.course,
    scan_time: new Date().toISOString(),
    is_live: isLive,
    model_type: 'baseline_history_fit',
    edges: actionableEdges,
    strong_count: actionableEdges.filter((e) => e.tier === 'strong').length,
    playable_count: actionableEdges.filter((e) => e.tier === 'playable').length,
    total_scanned: allEdges.length,
  };
}

/**
 * Calculate bankroll allocation for a set of edges
 * Uses simultaneous Kelly with adjustment for correlated bets
 */
export function calculatePortfolio(
  edges: EdgeOpportunity[],
  bankroll: number,
  kellyMultiplier: number = 0.25
): { edge: EdgeOpportunity; bet_amount: number; potential_payout: number }[] {
  // Only allocate to playable+ edges
  const qualifying = edges.filter((e) => e.tier === 'strong' || e.tier === 'playable');

  // Cap total allocation at 15% of bankroll across all bets
  const MAX_TOTAL_ALLOCATION = 0.15;
  const MAX_SINGLE_BET = 0.05; // 5% max on any single bet

  let totalAllocation = 0;

  return qualifying.map((edge) => {
    const kellyBet = edge.kelly_fraction * kellyMultiplier;
    const cappedBet = Math.min(kellyBet, MAX_SINGLE_BET);
    const remainingRoom = MAX_TOTAL_ALLOCATION - totalAllocation;
    const finalBet = Math.min(cappedBet, Math.max(0, remainingRoom));

    totalAllocation += finalBet;

    const betAmount = Math.round(bankroll * finalBet * 100) / 100;
    const contracts = Math.floor(betAmount / (edge.contract_price / 100));
    const potentialPayout = contracts * 1.0; // $1 per contract if correct

    return {
      edge,
      bet_amount: betAmount,
      potential_payout: potentialPayout,
    };
  });
}
