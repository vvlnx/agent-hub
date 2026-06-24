# ThroatScan Oracle — Development Diary

**Project:** Bitget AI Base Camp Hackathon S1, Track 3 — US Stock AI Trading  
**Public demo:** https://throatscan-oracle.vercel.app  
**Repository:** https://github.com/vvlnx/agent-hub (`projects/throatscan-oracle`)

## Week 1 — Problem framing

We started from a concrete gap in tokenized US stock trading: theme screeners rank
by narrative and momentum, but traders on Bitget still need to know **which public
company actually controls the scarce layer** in a supply chain—and whether that
name is **API-tradable today** as a stock token.

ThroatScan Oracle treats the industry query as a constrained reasoning problem,
not a single LLM prompt. Hard gates (sector alignment, structural control, Bitget
listing) sit outside the model so the UI cannot “hallucinate” tradability.

## Week 2 — Reasoning engine + Agent Hub evidence

We built a deterministic supply-chain pipeline with audit trails, then wired
official Agent Hub skills:

- `news-briefing` for cited headlines
- `macro-analyst` for rates, inflation, employment, VIX, Nasdaq, DXY

Event rules extract supply-side signals and apply a **capped ±12** confidence overlay
so recent news adjusts—but never replaces—the structural bottleneck score.

## Week 3 — Bitget integration (v3 official API)

We migrated the equity catalog to Bitget’s official v3 endpoints:

- `GET /api/v3/market/instruments?category=SPOT` with `symbolType=stock`
- `GET /api/v3/market/tickers?category=SPOT`
- Daily candles via v2 until v3 candle params stabilize

NVDA resolves to **`RNVDAUSDT` (Tier A)** when online. Paper execution uses the
same resolver as analysis—not a hard-coded Ondo symbol.

Backtests pull **real Bitget daily candles**, include fees, a benchmark, 40% position
cap, 15% trailing stop, and rebalance every 20 observations. Every run exports a
SHA-256 evidence hash.

## Week 4 — GICS discovery + submission hardening

We added GICS prefix peer discovery (pre-indexed at catalog load), lazy-loaded GICS
research reports, SSE analyze streaming for judge-visible progress, and a
four-dimension self-assessment panel.

Submission artifacts:

- Live demo on Vercel
- Sample evidence JSON (`/sample-evidence-ai-chips.json`)
- Verify scripts: `verify:bitget`, `verify:industries`, `verify:gics`
- CI workflow for typecheck + verify on PR

## What we learned

1. **Tradability is a first-class output**, not a post-label—Bitget symbol resolution
   must be in the critical path.
2. **Judges need verifiable artifacts**, not just UI—checksums, API endpoints, and
   trade logs matter as much as the thesis.
3. **Lazy-loading heavy research** (GICS reports) keeps the 60s serverless budget
   for the decision + backtest path.

## Next steps (post-hackathon)

- Bitget Demo API paper routing in production with env credentials
- Durable paper-order store (KV) on Vercel
- Automated app-universe sync from v3 instruments (`npm run sync:bitget-app-universe`)

This is research software—not financial advice.
