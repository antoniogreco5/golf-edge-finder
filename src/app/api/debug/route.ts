import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DG = 'https://feeds.datagolf.com';

export async function GET() {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' });

  const results: Record<string, unknown> = {};

  try {
    const res = await fetch(
      DG + '/betting-tools/outrights?tour=pga&market=win&odds_format=percent&file_format=json&key=' + key
    );
    const raw = await res.text();
    const parsed = JSON.parse(raw);
    results.outrights_win = {
      status: res.status,
      is_array: Array.isArray(parsed),
      keys: Array.isArray(parsed) ? 'array_len_' + parsed.length : Object.keys(parsed),
      first_item: Array.isArray(parsed) ? parsed[0] : parsed[Object.keys(parsed)[0]],
      second_item: Array.isArray(parsed) ? parsed[1] : null,
    };
  } catch (err) {
    results.outrights_win = { error: err instanceof Error ? err.message : 'fail' };
  }

  try {
    const res = await fetch(
      DG + '/preds/pre-tournament?tour=pga&odds_format=percent&file_format=json&key=' + key
    );
    const raw = await res.text();
    const parsed = JSON.parse(raw);
    results.pre_tournament = {
      status: res.status,
      keys: Object.keys(parsed),
      event: parsed.event_name,
      sample: Array.isArray(parsed.baseline_history_fit) ? parsed.baseline_history_fit.slice(0,2) : 'not array',
    };
  } catch (err) {
    results.pre_tournament = { error: err instanceof Error ? err.message : 'fail' };
  }

  return NextResponse.json(results);
}
