# Public Demo Deployment

ThroatScan Oracle is designed for one-click public demo deployment on Vercel.

## Quick deploy (recommended)

1. Push this project to a public GitHub repository.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Set **Root Directory** to `projects/throatscan-oracle` if deploying from the monorepo.
4. Deploy with defaults — `vercel.json` already sets `/api/analyze` to 60s max duration.
5. After deploy, set environment variable:

```bash
THROATSCAN_PUBLIC_DEMO_URL=https://your-project.vercel.app
```

6. Open `https://your-project.vercel.app/api/health` — should return `ok: true`.

## Judge-friendly demo flow (no clone required)

1. Open the public demo URL.
2. Click **One-click demo: AI chips**.
3. Wait for the six-step analysis pipeline (Bitget + Agent Hub run in parallel server-side).
4. Click **Execute paper basket** to record local paper fills at live Bitget prices.
5. Download the evidence JSON and note the SHA-256 checksum.

## Runnability tiers

| Tier | What judges see | Requirements |
| --- | --- | --- |
| Backtest + evidence | Bitget candle backtest, trade log, downloadable JSON | Public demo URL only |
| Local paper | **Execute paper basket** button, order log in UI | Bitget public API reachable |
| Bitget Demo API | Demo balance + `paptrading=1` order IDs | `BITGET_DEMO_*` env vars on server |

Live trading is intentionally locked in the UI.

## Warmup and cold start

The UI calls `/api/warmup` on load to cache Bitget symbols/tickers for 5 minutes.
Use `/api/health` for monitoring:

```bash
curl -s https://your-project.vercel.app/api/health | jq
curl -s https://your-project.vercel.app/api/warmup | jq
```

If Agent Hub MCP is slow, analysis still completes with partial research status — it does not fabricate news.

## Optional Bitget Demo Trading (Tier 2)

1. Log in to Bitget and switch to **Demo Trading** mode.
2. Create a **Demo API Key** with read + trade permissions (no withdrawals).
3. Add to Vercel project settings:

```bash
BITGET_DEMO_API_KEY=...
BITGET_DEMO_SECRET_KEY=...
BITGET_DEMO_PASSPHRASE=...
```

4. Redeploy. `/api/paper/status` should report `mode: "bitget_demo"`.

## Local verification before deploy

```bash
npm install
npm run build
npm run verify:industries
npm run verify:bitget
curl -s http://localhost:3000/api/health
```

## Submission checklist

- [ ] Public demo URL live
- [ ] `/api/health` returns `ok: true`
- [ ] One-click AI chips demo works end-to-end
- [ ] Paper basket execution works (local paper minimum)
- [ ] Demo video shows public URL + paper execute + evidence download
