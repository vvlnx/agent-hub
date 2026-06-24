# ThroatScan Oracle

ThroatScan Oracle is an AI-assisted research and portfolio-construction agent for
Bitget tokenized US stocks. It identifies structural supply-chain bottlenecks,
maps them to tradable US stock tokens, and explains why each company belongs in
or should be excluded from a portfolio.

The project is being built for **Bitget AI Base Camp Hackathon S1, Track 3:
US Stock AI Trading**.

## Problem

Theme-based stock screeners usually rank companies by valuation, momentum, or
keyword exposure. They often miss the companies that control scarce upstream
resources, while including unrelated companies that merely mention the same
narrative.

ThroatScan separates:

- the industry demand driver;
- the binding supply-chain layer;
- companies with structural control over that layer;
- companies that are actually tradable as Bitget tokenized US stocks.

## Current Demo

1. Enter an industry theme such as `AI chips`, `EV battery`, or `Oil and Gas`.
2. The reasoning engine builds a constrained supply-chain model. When enabled,
   OpenAI Responses API web search grounds industry interpretation and records
   the consulted URLs; it still cannot select tickers or bypass hard constraints.
3. Candidates pass sector-alignment, role-fit, and structural-control gates.
4. Official Agent Hub `news-briefing` and `macro-analyst` workflows add live
   headlines, rates, inflation, employment, VIX, Nasdaq, and dollar context.
5. Deterministic event rules extract supply restrictions, substitution,
   capacity, demand, regulatory, and geopolitical signals from cited news.
6. The system evaluates bottleneck impact, applies a capped ±12-point evidence
   overlay, and produces an explainable simulated-trading decision.
7. The UI shows the primary bottleneck, alternatives, confidence, audit trail,
   event decision trace, and portfolio analysis.

The backtest panel uses Bitget tokenized-stock daily candles, includes trading
fees and a SPY token benchmark, and exposes a downloadable evidence bundle with
raw candles, simulated trades, API endpoints, timestamps, and a SHA-256 checksum.
The simulation enforces a 40% single-position cap, keeps unused capital in cash,
checks a 15% trailing stop, and rebalances every 20 shared trading observations.

## Bitget Data Path

The project uses Bitget public market endpoints as the source of truth for
tokenized-stock availability and market evidence:

- `GET /api/v3/market/instruments?category=SPOT` — official stock-token universe (`symbolType=stock`)
- `GET /api/v3/market/tickers?category=SPOT` — live price and liquidity
- `GET /api/v2/spot/market/candles` — verifiable daily history

Examples currently returned by Bitget include `RNVDAUSDT`, `RAAPLUSDT`,
`RMSFTUSDT`, `RAMZNUSDT`, and benchmark `BTCUSDT` / `SPY`-linked tokens when online.
Policy prefers **rToken** spot symbols (e.g. `RNVDAUSDT`) over legacy Ondo-style names when both exist.

## Agent Hub Research Path

The server-side analysis workflow connects to the public Agent Hub market-data
MCP at `https://datahub.noxiaohao.com/mcp`. No API key is required.

- `news-briefing`: company-focused headline search with source links and timestamps
- `macro-analyst`: Fed rates, Treasury yields, CPI, Core PCE, payrolls, GDP,
  unemployment, VIX, Nasdaq 100, and DXY

Research calls run in parallel with Bitget market verification. Their raw
results, source, tools used, and fetch timestamps are included in the
downloadable evidence JSON. Set `THROATSCAN_MARKET_RESEARCH=0` only when an
offline development run is required.

Current evidence selects today's simulated basket. Historical Bitget candles
validate that basket only; the system does not back-propagate current news into
historical dates.

See [docs/TRACK3_ROADMAP.md](docs/TRACK3_ROADMAP.md) for the implementation and
delivery plan, and [docs/SUBMISSION.md](docs/SUBMISSION.md) for the under-200-word
description, three-minute demo script, and final submission checklist.

## Public Demo

Deploy to Vercel for a judge-accessible URL (no clone required). See
[docs/DEPLOY.md](docs/DEPLOY.md) for step-by-step instructions, health checks, and
Bitget Demo Trading setup.

After deploy, verify:

```bash
curl -s https://YOUR-DEMO-URL/api/health
curl -s https://YOUR-DEMO-URL/api/warmup
```

Set `THROATSCAN_PUBLIC_DEMO_URL` in the deployment environment so `/api/health`
returns the public link.

## Paper Trading (Runnability)

The demo supports three runnability tiers:

1. **Backtest + evidence** — Bitget candle validation and downloadable JSON (default).
2. **Local paper** — **Execute paper basket** records market fills at live Bitget public
   prices (enabled when public market data is reachable).
3. **Bitget Demo API** — optional `BITGET_DEMO_*` server credentials submit demo spot
   orders with `paptrading=1`.

Live trading remains locked in the UI. Configure demo keys in `.env.example`.

## Run Locally

Requirements:

- Node.js 20+
- npm

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Verification

```bash
npm run lint
npm run typecheck
npm run verify:industries
npm run verify:bitget
npm run verify:gics
npm run build
```

`verify:industries` checks deterministic output, audit fields, structural
constraints, and obvious cross-sector recommendation failures.

## Optional LLM Configuration

The deterministic reasoning engine works without an API key. To augment industry
interpretation with the OpenAI Responses API and hosted web search:

```bash
cp .env.example .env.local
```

Then configure the variables documented in `.env.example`.

The default model is `gpt-5.4-mini` to balance latency and cost. Set
`OPENAI_MODEL=gpt-5.5` for the strongest current OpenAI web-search path. Custom
`OPENAI_BASE_URL` providers must implement `/v1/responses`, structured outputs,
and the `web_search` hosted tool; Chat Completions-only providers will fall back
to the deterministic engine.

## Track 3 Submission Status

- Runnable local demo: complete
- Public deployment guide + health/warmup endpoints: complete
- Local paper trading execution: complete
- Optional Bitget Demo API paper routing: complete (requires server env)
- One-click demo industry (AI chips): complete
- Supply-chain reasoning and audit trail: complete
- Cross-sector candidate gating: complete
- Bitget tokenized-stock universe filter: complete
- Verifiable Bitget-candle backtest: complete
- Agent Hub news and macro evidence: complete
- Event extraction, bottleneck-impact assessment, and confidence overlay: complete
- Downloadable trade and API evidence: complete
- Simulated portfolio risk loop: complete
- Four-dimension judge self-assessment + tradability guide: complete
- Sample evidence JSON for offline review: complete
- Public deployment URL (Vercel): https://throatscan-oracle.vercel.app
- Public GitHub repository: https://github.com/vvlnx/agent-hub (`projects/throatscan-oracle`, commit on `main`)
- Demo video script: [docs/SUBMISSION.md](docs/SUBMISSION.md) — record and paste URL into submission form
- Development diary: [docs/DEVELOPMENT_DIARY.md](docs/DEVELOPMENT_DIARY.md)
- Submission pack: [docs/SUBMISSION.md](docs/SUBMISSION.md)

This project is research software and does not provide financial advice.
