import { NextRequest, NextResponse } from 'next/server';
import { getPreTournamentPredictions, getLivePredictions } from '@/lib/datagolf';
import { getGolfEvents, getEventMarkets } from '@/lib/kalshi';
import { runEdgeScan } from '@/lib/edge-engine';
import { sendEdgeAlerts } from '@/lib/notify';
import { DEFAULT_THRESHOLDS } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Cron endpoint - called by Vercel Cron Jobs
 * Configure in vercel.json: runs every 15 min Thu-Sun (tournament days)
 * Checks for edges and sends notifications automatically
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try live first, fall back to pre-tournament
    let dgData;
    let isLive = false;

    try {
      dgData = await getLivePredictions('pga');
      isLive = dgData.is_live;
    } catch {
      const preTourney = await getPreTournamentPredictions('pga');
      dgData = { ...preTourney, is_live: false };
    }

    // Fetch Kalshi markets
    const golfEvents = await getGolfEvents();
    let allMarkets = golfEvents.flatMap((e) => e.markets);

    if (allMarkets.length === 0 && golfEvents.length > 0) {
      const marketPromises = golfEvents.map((e) => getEventMarkets(e.event_ticker));
      const marketArrays = await Promise.all(marketPromises);
      allMarkets = marketArrays.flat();
    }

    // Run scan
    const scan = runEdgeScan(
      dgData.tournament,
      dgData.players,
      allMarkets,
      isLive,
      DEFAULT_THRESHOLDS
    );

    // Send alerts for strong + playable edges
    let alertResult = { sent: 0, method: 'none' };
    if (scan.strong_count > 0 || scan.playable_count > 0) {
      alertResult = await sendEdgeAlerts(scan.edges, 'playable');
    }

    return NextResponse.json({
      success: true,
      tournament: scan.tournament,
      is_live: isLive,
      strong_edges: scan.strong_count,
      playable_edges: scan.playable_count,
      total_scanned: scan.total_scanned,
      alerts_sent: alertResult.sent,
      alert_method: alertResult.method,
      scan_time: scan.scan_time,
    });
  } catch (error) {
    console.error('Cron scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron scan failed',
      },
      { status: 500 }
    );
  }
}
