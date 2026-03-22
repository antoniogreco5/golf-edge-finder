import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DG = 'https://feeds.datagolf.com';

export async function GET() {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' });

  try {
    const res = await fetch(
      DG + '/betting-tools/outrights?tour=pga&market=win&odds_format=percent&file_format=json&key=' + key
    );
    const data = await res.json();
    const odds = data.odds || [];
    return NextResponse.json({
      event: data.event_name,
      books: data.books_offering,
      market: data.market,
      odds_count: Array.isArray(odds) ? odds.length : typeof odds,
      first_two_players: Array.isArray(odds) ? odds.slice(0, 2) : Object.entries(odds).slice(0, 2),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' });
  }
}
