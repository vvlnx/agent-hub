# Track 3 Gap Audit

Official source: <https://bitget-ai.gitbook.io/hackathon/>

Audit date: June 15, 2026

## Official Track 3 Requirements

- Demo link or GitHub repository: one is required.
- Project description under 200 words explaining the real US stock tokenized
  trading problem.
- Demo video is optional and must be no longer than three minutes.
- Judging focus: solve a real problem, provide verifiable backtest or simulated
  trading records, and use Bitget US stock data or tools.
- All-track baseline: the demo must actually run and include verifiable usage
  evidence.

## Current Project Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| Real US stock-token trading problem | Ready | Bottleneck-based discovery reduces narrative-only stock selection |
| Runnable demo | Ready locally | `http://localhost:3000` |
| Bitget US stock data/tools | Ready | Symbols, tickers, and candle endpoints |
| Verifiable backtest/sim trading | Ready | Bitget candles, trade log, risk state, evidence hash |
| Verifiable usage evidence | Ready | Downloadable JSON with API calls, events, candles, and trades |
| Project description under 200 words | Ready | `docs/SUBMISSION.md` |
| Public demo or public GitHub repository | Missing | Must be published before submission |
| Final submission form | Missing | Submit before June 25, 2026, 24:00 |
| Community/development diary post | Missing | Needed for participation/community awards |

## LLM Status

The application supports constrained LLM augmentation for industry
interpretation and supply-chain layer signals. `THROATSCAN_LLM=1` is configured,
but no OpenAI-compatible API key is currently available, so the runtime
truthfully reports rule-engine-only mode.

LLM augmentation does not directly select tickers and cannot bypass hard
constraints. The current fixed company universe still limits reliable industry
coverage even after an LLM is enabled.
