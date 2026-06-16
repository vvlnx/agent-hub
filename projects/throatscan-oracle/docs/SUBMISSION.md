# Track 3 Submission Pack

Submission window: **June 15-25, 2026**

## Project Description (Under 200 Words)

ThroatScan Oracle is an AI-assisted research and simulated-trading agent for
Bitget tokenized US stocks. Theme-based stock screeners often select companies
with narrative exposure while missing the upstream businesses that control
scarce resources. ThroatScan converts an industry thesis into an auditable
supply-chain model, identifies the binding bottleneck, applies hard
sector-alignment and structural-control gates, and maps qualified companies to
currently online Bitget stock tokens.

For every run, the system shows its reasoning chain, uncertainty, rejected
alternatives, official Agent Hub news and macro evidence, Bitget symbol status,
live market evidence, extracted supply-chain events, bottleneck-impact
assessment, and an actionable risk-managed portfolio. Recent evidence applies
a capped confidence overlay while preserving the structural base score. Its simulation
uses Bitget public daily candles and a Bitget SPY token benchmark, includes
fees, caps each position at 40%, checks a 15% trailing stop, and rebalances
every 20 shared observations. Users can download the complete evidence bundle
containing raw candles, simulated trades, market research, portfolio state, API
endpoints, timestamps, and a SHA-256 checksum.

The result is a reproducible workflow for discovering and testing structural
US-stock-token opportunities rather than relying on opaque stock scores.

## Three-Minute Demo Script

### 0:00-0:25 - Problem

- Theme screeners over-select popular names and often miss real supply-chain
  control points.
- ThroatScan finds structural bottlenecks and restricts actionable output to
  Bitget-tradable US stock tokens.

### 0:25-1:10 - Reasoning

- Enter `AI chips` and run the analysis.
- Show the core bottleneck, low-confidence warning, alternative hypothesis, and
  why unrelated or weaker candidates were excluded.
- Show the Agent Hub news evidence and macro regime card.
- Follow the six-step event decision trace from industry input to extracted
  events, bottleneck impact, candidate-confidence adjustment, and simulated action.
- Point out that the system does not force a Top 5 when evidence is incomplete.

### 1:10-1:45 - Bitget Integration

- Show `NVDAONUSDT` online status, live Bitget price/liquidity fields, and
  non-listed candidate labels.
- Explain that `/spot/public/symbols`, `/spot/market/tickers`, and
  `/spot/market/candles` are used as evidence sources.

### 1:45-2:35 - Simulation and Risk Loop

- Show the Bitget-candle period, SPYONUSDT benchmark, fees, drawdown, volatility,
  alpha, and Sharpe ratio.
- Point out that current evidence selects today's basket while historical
  candles only validate it, avoiding look-ahead claims.
- Show the 40% position cap, cash buffer, 15% trailing stop, and periodic
  rebalance events.
- Open the simulated trade log and highlight portfolio state after each trade.

### 2:35-3:00 - Verification

- Download the evidence JSON and show the SHA-256 checksum.
- Run `npm run verify:industries` and `npm run verify:bitget`.
- Close with the reproducible trading loop: thesis, bottleneck, Bitget gate,
  risk-managed simulation, evidence.

## Submission Checklist

- [ ] Public demo URL
- [ ] Public GitHub repository
- [x] Project description under 200 words
- [x] Reproducible Bitget usage evidence
- [x] Verifiable backtest and simulated trade records
- [x] Three-minute demo script
- [ ] Demo video URL, no longer than three minutes
- [ ] Development diary and project-introduction post
- [ ] Final submission form completed between June 15 and June 25, 2026
