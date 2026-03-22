// ─── DataGolf Types ───────────────────────────────────────────

export interface DGPlayerPrediction {
  dg_id: number;
  player_name: string;
  country: string;
  win: number;        // probability as decimal (0.15 = 15%)
  top_5: number;
  top_10: number;
  top_20: number;
  make_cut: number;
  // Live model additional fields
  current_pos?: number;
  current_score?: number;
  thru?: number;
  round?: number;
}

export interface DGTournament {
  event_name: string;
  course: string;
  start_date: string;
  end_date: string;
  tour: string;
}

// ─── Kalshi Types ─────────────────────────────────────────────

export interface KalshiMarket {
  ticker: string;
  title: string;
  event_ticker: string;
  subtitle?: string;
  yes_bid: number;       // contract price 0-100 (cents)
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  open_interest: number;
  status: string;
  close_time: string;
  result?: string;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  markets: KalshiMarket[];
}

// ─── Edge Calculation Types ───────────────────────────────────

export type MarketType = 'win' | 'top_5' | 'top_10' | 'top_20' | 'make_cut';

export type EdgeTier = 'strong' | 'playable' | 'monitor' | 'none';

export interface EdgeOpportunity {
  id: string;
  player_name: string;
  player_id: number;
  market_type: MarketType;
  market_label: string;

  // Probabilities (all 0-100 scale)
  model_prob: number;       // DataGolf model probability
  market_prob: number;      // Kalshi implied probability
  edge: number;             // model_prob - market_prob
  edge_pct: number;         // edge / market_prob (relative edge)

  // Kelly sizing
  kelly_fraction: number;   // full Kelly
  half_kelly: number;       // recommended bet size fraction
  quarter_kelly: number;

  // Contract details
  contract_price: number;   // what you'd pay (cents)
  payout: number;           // $1.00 if correct
  expected_value: number;   // (model_prob * payout) - contract_price

  // Market health
  volume: number;
  open_interest: number;
  liquidity_grade: 'A' | 'B' | 'C' | 'D';

  // Classification
  tier: EdgeTier;
  is_live: boolean;
  timestamp: string;

  // Optional Kalshi link info
  kalshi_ticker?: string;
  kalshi_event_ticker?: string;
}

export interface TournamentEdgeScan {
  tournament: string;
  course: string;
  scan_time: string;
  is_live: boolean;
  round?: number;
  model_type: 'baseline' | 'baseline_history_fit';
  edges: EdgeOpportunity[];
  strong_count: number;
  playable_count: number;
  total_scanned: number;
}

// ─── Edge Thresholds ──────────────────────────────────────────

export interface EdgeThresholds {
  // Minimum raw edge (percentage points) by market type
  strong: Record<MarketType, number>;
  playable: Record<MarketType, number>;
  // Minimum volume to consider
  min_volume: number;
  // Minimum open interest
  min_open_interest: number;
  // Kelly fraction to use (0.25 = quarter Kelly)
  kelly_multiplier: number;
}

export const DEFAULT_THRESHOLDS: EdgeThresholds = {
  strong: {
    win: 5.0,       // 5+ points on outrights (higher bar bc low prob)
    top_5: 5.0,
    top_10: 4.0,
    top_20: 4.0,
    make_cut: 5.0,
  },
  playable: {
    win: 3.0,
    top_5: 3.0,
    top_10: 2.5,
    top_20: 2.5,
    make_cut: 3.0,
  },
  min_volume: 20,
  min_open_interest: 10,
  kelly_multiplier: 0.25,  // quarter Kelly default
};

// ─── Notification Types ───────────────────────────────────────

export interface NotificationPrefs {
  enabled: boolean;
  method: 'email' | 'push' | 'both';
  email?: string;
  push_endpoint?: string;   // ntfy.sh topic or Pushover key
  min_tier: EdgeTier;       // minimum tier to trigger alert
  quiet_hours?: { start: number; end: number }; // 0-23 hour range
}

// ─── API Response Types ───────────────────────────────────────

export interface ScanResponse {
  success: boolean;
  data?: TournamentEdgeScan;
  error?: string;
  cached?: boolean;
}

export interface NotifyResponse {
  success: boolean;
  sent_count: number;
  method: string;
  error?: string;
}
