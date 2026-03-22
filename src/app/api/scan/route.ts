import { NextRequest, NextResponse } from 'next/server';
import { getPreTournamentPredictions, getLivePredictions } from '@/lib/datagolf';
import { getGolfEvents, getEventMarkets } from '@/lib/kalshi';
import { runEdgeScan } from '@/lib/edge-engine';
import { sendEdgeAlerts } from '@/lib/notify';
import { DEFAULT_THRESHOLDS } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Vercel function timeout

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = searchParams.get('tour') || 'pga';
    const notify = searchParams.get('notify') === 'true';
    const live = searchParams.get('live') === 'true';

    // 1. Fetch DataGolf predictions
    let dgData;
    let isLive = false;

    if (live) {
      dgData = await getLivePredictions(tour);
      isLive = dgData.is_live;
    } else {
      const preTourney = await getPreTournamentPredictions(tour);
      dgData = { ...preTourney, is_live: false };
    }

    // 2. Fetch Kalshi golf markets
    const golfEvents = await getGolfEvents();

    // Collect all markets across golf events
    let allMarkets = golfEvents.flatMap((e) => e.markets);

    // If nested markets weren't included, fetch them
    if (allMarkets.length === 0 && golfEvents.length > 0) {
      const marketPromises = golfEvents.map((e) => getEventMarkets(e.event_ticker));
      const marketArrays = await Promise.all(marketPromises);
      allMarkets = marketArrays.flat();
    }

    // 3. Run edge calculation
    const scan = runEdgeScan(
      dgData.tournament,
      dgData.players,
      allMarkets,
      isLive,
      DEFAULT_THRESHOLDS
    );

    // 4. Optionally send alerts
    if (notify && (scan.strong_count > 0 || scan.playable_count > 0)) {
      await sendEdgeAlerts(scan.edges, 'playable');
    }

    return NextResponse.json({
      success: true,
      data: scan,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
