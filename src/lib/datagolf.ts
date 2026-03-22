import { DGPlayerPrediction, DGTournament } from '@/types';

const DG_BASE = 'https://feeds.datagolf.com';

function getApiKey(): string {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) throw new Error('DATAGOLF_API_KEY not set');
  return key;
}

/**
 * Fetch pre-tournament predictions from DataGolf
 * Returns model probabilities for win, top5, top10, top20, make_cut
 */
export async function getPreTournamentPredictions(
  tour: string = 'pga',
  model: 'baseline' | 'baseline_history_fit' = 'baseline_history_fit'
): Promise<{ tournament: DGTournament; players: DGPlayerPrediction[] }> {
  const params = new URLSearchParams({
    tour,
    odds_format: 'percent',
    file_format: 'json',
    key: getApiKey(),
  });

  // Add dead heat adjustment for more accurate probs
  params.set('dead_heat', 'yes');

  const res = await fetch(`${DG_BASE}/preds/pre-tournament?${params}`, {
    next: { revalidate: 900 }, // cache 15 min
  });

  if (!res.ok) {
    throw new Error(`DataGolf API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // DataGolf returns baseline and baseline+history models
  // We use the specified model
  const modelKey = model === 'baseline_history_fit' ? 'baseline_history_fit' : 'baseline';

  const tournament: DGTournament = {
    event_name: data.event_name || 'Unknown Event',
    course: data.course || '',
    start_date: data.event_start || '',
    end_date: data.event_end || '',
    tour: tour.toUpperCase(),
  };

  const players: DGPlayerPrediction[] = (data[modelKey] || data.baseline || []).map(
    (p: Record<string, unknown>) => ({
      dg_id: p.dg_id as number,
      player_name: p.player_name as string,
      country: p.country as string || '',
      win: (p.win as number) || 0,
      top_5: (p.top_5 as number) || 0,
      top_10: (p.top_10 as number) || 0,
      top_20: (p.top_20 as number) || 0,
      make_cut: (p.make_cut as number) || 0,
    })
  );

  return { tournament, players };
}

/**
 * Fetch LIVE in-play predictions during an active tournament
 * These update as the tournament progresses
 */
export async function getLivePredictions(
  tour: string = 'pga'
): Promise<{ tournament: DGTournament; players: DGPlayerPrediction[]; is_live: boolean }> {
  const params = new URLSearchParams({
    tour,
    odds_format: 'percent',
    file_format: 'json',
    key: getApiKey(),
  });

  const res = await fetch(`${DG_BASE}/preds/in-play?${params}`, {
    next: { revalidate: 120 }, // cache 2 min during live
  });

  if (!res.ok) {
    // If no live tournament, fall back to pre-tournament
    if (res.status === 404 || res.status === 400) {
      const preTourney = await getPreTournamentPredictions(tour);
      return { ...preTourney, is_live: false };
    }
    throw new Error(`DataGolf Live API error: ${res.status}`);
  }

  const data = await res.json();

  const tournament: DGTournament = {
    event_name: data.event_name || 'Unknown Event',
    course: data.course || '',
    start_date: '',
    end_date: '',
    tour: tour.toUpperCase(),
  };

  const players: DGPlayerPrediction[] = (data.data || []).map(
    (p: Record<string, unknown>) => ({
      dg_id: p.dg_id as number,
      player_name: p.player_name as string,
      country: p.country as string || '',
      win: (p.win as number) || 0,
      top_5: (p.top_5 as number) || 0,
      top_10: (p.top_10 as number) || 0,
      top_20: (p.top_20 as number) || 0,
      make_cut: (p.make_cut as number) || 0,
      current_pos: p.current_pos as number | undefined,
      current_score: p.current_score as number | undefined,
      thru: p.thru as number | undefined,
      round: p.current_round as number | undefined,
    })
  );

  return { tournament, players, is_live: true };
}

/**
 * Get the current tournament schedule to know what's active
 */
export async function getCurrentTournament(tour: string = 'pga') {
  const params = new URLSearchParams({
    tour,
    file_format: 'json',
    key: getApiKey(),
  });

  const res = await fetch(`${DG_BASE}/get-schedule?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const data = await res.json();

  // Find current/next event
  const now = new Date();
  const upcoming = (data.schedule || []).find(
    (e: Record<string, string>) => new Date(e.end_date) >= now
  );

  return upcoming || null;
}
