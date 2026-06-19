# Track 3 Gap Audit

Official source: <https://bitget-ai.gitbook.io/hackathon/>

Audit date: June 19, 2026

## Official Track 3 Requirements

- Demo link or GitHub repository: one is required.
- Project description under 200 words explaining the real US stock tokenized
  trading problem.
- Demo video is optional and must be no longer than three minutes.
- Judging focus: solve a real problem, provide verifiable backtest or simulated
  trading records, and use Bitget US stock data or tools.
- All-track baseline: the demo must actually run and include verifiable usage
  evidence.

## Four-Dimension Completeness (Dimension 3 focus)

| Gap (previously) | Status | Evidence |
| --- | --- | --- |
| No public demo | **Fixed** | https://throatscan-oracle.vercel.app |
| No judge self-assessment | **Fixed** | In-app panel + `submission_rubric_self_assessment` in evidence JSON |
| Zero-tradability edge case unclear | **Fixed** | `tradability_guide` with SPY/QQQ proxies + recommended action |
| End-to-end stages not visible | **Fixed** | `completeness.end_to_end_stages` chips in UI |
| Honest boundaries buried | **Fixed** | `honest_summary` + gaps per rubric dimension |
| Sample evidence for offline judges | **Fixed** | `/sample-evidence-ai-chips.json` |
| Demo video | Pending | Manual deliverable |
| Dev diary / intro post | Pending | Manual deliverable |
| Submission form | Pending | Manual deliverable |
| Public GitHub repo | Pending | User action |

## Current Project Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| Real US stock-token trading problem | Ready | Bottleneck-based discovery reduces narrative-only stock selection |
| Runnable demo | Ready | https://throatscan-oracle.vercel.app |
| Bitget US stock data/tools | Ready | Symbols, tickers, and candle endpoints |
| Verifiable backtest/sim trading | Ready | Bitget candles, trade log, risk state, evidence hash |
| Verifiable usage evidence | Ready | Downloadable JSON with API calls, events, candles, and trades |
| Project description under 200 words | Ready | `docs/SUBMISSION.md` |
| Public demo or public GitHub repository | Ready (demo) | Vercel production alias |
| Judge self-assessment (4 dimensions) | Ready | `lib/completeness/` + UI panel |
| Final submission form | Missing | Submit before June 25, 2026, 24:00 |
| Community/development diary post | Missing | Needed for participation/community awards |

## LLM Status

The application supports constrained LLM augmentation for industry
interpretation and supply-chain layer signals. When no OpenAI-compatible API key
is configured, the runtime uses rules/curated grounding and reports that honestly
in the Completeness and Thesis panels.

LLM augmentation does not directly select tickers and cannot bypass hard
constraints. The current fixed company universe still limits reliable industry
coverage even after an LLM is enabled.
