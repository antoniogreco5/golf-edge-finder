# Golf Edge Finder

Find discrepancies between DataGolf's predictive model probabilities and Robinhood/Kalshi prediction market contract prices. Surfaces actionable edges with Kelly Criterion sizing and automated alerts.

## How It Works

1. **DataGolf Model** — Pulls win/top 5/top 10/top 20/make cut probabilities from DataGolf's regression + simulation model (both pre-tournament and live in-play)
2. **Kalshi Markets** — Fetches real-time contract prices from Kalshi (the exchange powering Robinhood's prediction markets)
3. **Edge Engine** — Compares model % vs contract implied %, calculates raw edge, relative edge, Kelly sizing, and expected value per contract
4. **Tiered Classification** — Labels edges as Strong, Playable, or Monitor based on configurable thresholds and liquidity filters
5. **Automated Alerts** — Cron job scans every 15 min during tournament hours (Thu–Sun, 8am–8pm ET) and pushes notifications via email and/or phone

## Edge Thresholds

| Market Type | Strong | Playable |
|------------|--------|----------|
| Outright Win | 5+ pts | 3+ pts |
| Top 5 | 5+ pts | 3+ pts |
| Top 10 | 4+ pts | 2.5+ pts |
| Top 20 | 4+ pts | 2.5+ pts |
| Make Cut | 5+ pts | 3+ pts |

All edges also require minimum volume (20) and open interest (10) to filter out thin/illiquid markets.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS + Framer Motion**
- **DataGolf API** (paid — Scratch membership)
- **Kalshi Public API** (free for market data, no auth needed)
- **Resend** for email alerts (free tier: 3k emails/mo)
- **ntfy.sh** for push notifications (free, no account)
- **Vercel** for hosting + cron jobs

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/antoniogreco5/golf-edge-finder.git
cd golf-edge-finder
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

- **DATAGOLF_API_KEY** — Get from [datagolf.com](https://datagolf.com) (requires Scratch membership, ~$30/yr)
- **ALERT_EMAIL** — Where you want edge alerts sent
- **NTFY_TOPIC** — Your unique ntfy.sh topic for phone push notifications
- **RESEND_API_KEY** — Free at [resend.com](https://resend.com)
- **CRON_SECRET** — Run `openssl rand -hex 32` to generate

### 3. Set Up Phone Notifications (Optional)

1. Install the **ntfy** app ([iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
2. Subscribe to a unique topic (e.g., `golf-edges-antonio-2026`)
3. Put that exact topic in your `.env.local` as `NTFY_TOPIC`
4. You'll now get push alerts when the cron finds edges

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Click **"Load Demo Data"** to see the UI with sample edges, or **"Scan for Edges"** once your DataGolf key is connected.

### 5. Deploy to Vercel

```bash
vercel
```

Add your env vars in Vercel Dashboard → Settings → Environment Variables.

The cron job in `vercel.json` will automatically scan every 15 minutes during tournament hours (Thu–Sun, 8am–8pm UTC). Note: Vercel cron jobs require the **Pro plan** ($20/mo) for schedules more frequent than daily.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | GET | Run edge scan. Params: `tour`, `live`, `notify` |
| `/api/notify` | GET | Cron endpoint — scans + sends alerts. Protected by `CRON_SECRET` |

## Architecture Notes

- **Quarter-Kelly default** — Conservative sizing to manage bankroll volatility
- **15% max total allocation** — Never more than 15% of bankroll across all concurrent bets
- **5% max single bet** — Cap on any individual position
- **Liquidity grading** — A/B/C/D scale based on volume + open interest; D-grade markets are filtered out entirely
- **Name matching** — Fuzzy matcher handles "Scottie Scheffler" vs "Scheffler, Scottie" across DG/Kalshi formats

## Disclaimer

This tool is for informational and educational purposes. Prediction market trading involves risk. Past model performance does not guarantee future results. Trade responsibly.
