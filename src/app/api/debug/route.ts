import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DG = 'https://feeds.datagolf.com';

export async function GET() {
  const key = process.env.DATAGOLF_API_KEY;
  if (!key) return NextResponse.json({ error: 'No API key' });

  const endpoints = [
    '/betting-tools/outrights',
    '/betting-tools/outright-odds',
    '/betting-tools/finish',
    '/preds/pre-tournament',
  ];

  const results: Record<string, unknown> = {};

  for (const ep of endpoints) {
    try {
      const res = await fetch(
        DG + ep + '?tour=pga&market=win&odds_format=implied_prob&file_format=json&key=' + key
      );
      const raw = await res.text();
      results[ep] = {
        status: res.status,
        preview: raw.substring(0, 500),
      };
    } catch (err) {
      results[ep] = { error: err instanceof Error ? err.message : 'fail' };
    }
  }

  return NextResponse.json(results);
}
