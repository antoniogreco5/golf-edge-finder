import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DG_BASE = 'https://feeds.datagolf.com';

export async function GET() {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' });

  try {
    const res = await fetch(
      DG_BASE + '/betting-tools/outrights?tour=pga&market=win&odds_format=implied_prob&file_format=json&key=' + key
    );
    const raw = await res.text();
    
    // Show first 3000 chars of raw response so we can see the structure
    return NextResponse.json({
      status: res.status,
      raw_preview: raw.substring(0, 3000),
      type: typeof JSON.parse(raw),
      is_array: Array.isArray(JSON.parse(raw)),
      keys: Array.isArray(JSON.parse(raw)) ? 'array' : Object.keys(JSON.parse(raw)),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'unknown' });
  }
}
