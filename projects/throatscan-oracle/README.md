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
2. The reasoning engine builds a constrained supply-chain model.
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

- `GET /api/v2/spot/public/symbols`
- `GET /api/v2/spot/market/tickers`
- `GET /api/v2/spot/market/candles`

Examples currently returned by Bitget include `NVDAONUSDT`, `AAPLONUSDT`,
`MSFTONUSDT`, `AMZNONUSDT`, `SPYONUSDT`, and `QQQONUSDT`.

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
npm run build
```

`verify:industries` checks deterministic output, audit fields, structural
constraints, and obvious cross-sector recommendation failures.

## Optional LLM Configuration

The deterministic reasoning engine works without an API key. To augment industry
interpretation with an OpenAI-compatible model:

```bash
cp .env.example .env.local
```

Then configure the variables documented in `.env.example`.

## Track 3 Submission Status

- Runnable local demo: complete
- Supply-chain reasoning and audit trail: complete
- Cross-sector candidate gating: complete
- Bitget tokenized-stock universe filter: complete
- Verifiable Bitget-candle backtest: complete
- Agent Hub news and macro evidence: complete
- Event extraction, bottleneck-impact assessment, and confidence overlay: complete
- Downloadable trade and API evidence: complete
- Simulated portfolio risk loop: complete
- Public deployment and short demo video: pending

This project is research software and does not provide financial advice.
