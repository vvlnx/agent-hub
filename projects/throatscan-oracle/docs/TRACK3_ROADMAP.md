# Track 3 Roadmap

## Competition Fit

Track 3 judges focus on:

1. a real problem in US stock tokenized trading;
2. a real, runnable demo;
3. verifiable backtest or simulated-trading records;
4. actual use of Bitget US stock data or tools;
5. at least one form of verifiable usage evidence.

ThroatScan's problem statement:

> Tokenized-stock traders can access many US equities, but theme-based discovery
> tools over-select narrative exposure and do not identify the companies that
> control scarce supply-chain resources. ThroatScan converts an industry thesis
> into an auditable, Bitget-tradable bottleneck portfolio.

## Target Trading Loop

```text
Industry thesis
  -> constrained supply-chain reasoning
  -> Agent Hub news and macro evidence
  -> supply-chain event extraction
  -> bottleneck impact assessment
  -> capped candidate-confidence adjustment
  -> sector and bottleneck candidate gates
  -> Bitget tokenized-stock availability gate
  -> portfolio weights and risk limits
  -> Bitget-candle backtest
  -> rebalance decisions
  -> downloadable trade and API evidence
```

## Verified Bitget Integration Path

No credentials are required for the public evidence path:

| Purpose | Bitget endpoint |
| --- | --- |
| Tradable stock-token universe | `/api/v2/spot/public/symbols` |
| Live price and liquidity evidence | `/api/v2/spot/market/tickers` |
| Verifiable historical candles | `/api/v2/spot/market/candles` |

The application will preserve the endpoint, symbol, fetch time, candle range,
and raw-data checksum in every generated backtest report.

## Delivery Stages

### Stage 1: Credible candidate selection

- Require direct industry-query alignment.
- Penalize diffuse sector overlap in confidence.
- Add deterministic cross-sector regression checks.

### Stage 2: Bitget-tradable universe

- Resolve company tickers to live Bitget symbols such as `NVDAONUSDT`.
- Exclude unavailable instruments from the actionable portfolio.
- Display current Bitget price, volume, spread, and symbol status.

### Stage 3: Verifiable backtest evidence

- Replace generated returns with Bitget daily candles.
- Include fees, missing-data handling, benchmark, drawdown, volatility, and
  Sharpe ratio.
- Export a JSON/CSV evidence bundle with input data and trade log.

### Stage 4: Simulated portfolio loop

- Create a paper portfolio from the top tradable bottlenecks.
- Generate entry, rebalance, stop-loss, and exit events.
- Persist run IDs and decision records.

### Stage 5: Agent Hub market research

- Query industry and top-candidate headlines through `news-briefing`.
- Query rates, inflation, employment, VIX, Nasdaq, and DXY through `macro-analyst`.
- Preserve research source, tools used, timestamps, and raw evidence.
- Extract auditable supply-chain events and map them to candidate confidence.
- Cap the event and macro overlay at ±12 points so recent evidence cannot hide
  the structural bottleneck score.
- Use current evidence only to select the current simulated basket; never
  back-propagate current news into historical return dates.

### Stage 6: Submission

- Deploy a public demo.
- Publish a reproducible English README.
- Record a demo video under three minutes.
- Prepare a project description under 200 words.
- Publish a qualifying development diary and project introduction.

## Acceptance Criteria

- No synthetic performance is labeled as a backtest.
- Every actionable ticker maps to a currently online Bitget stock token.
- Every performance metric can be reproduced from exported Bitget candles.
- Every simulated trade includes timestamp, symbol, side, quantity, price,
  reason, and portfolio state.
- Every research run records its Agent Hub skill, tool calls, and fetch time.
- Every candidate records base score, event delta, macro delta, adjusted score,
  supporting event IDs, and a bilingual explanation.
- A new developer can run the demo and verification commands from the README.
