# Fed Signal Rebalance Rules

Same logic for **live Agent** and **offline backtest**.

## Two-layer model

| Layer | Question | Output |
|-------|----------|--------|
| **L1 Macro** | Fed + trend + sentiment → risk budget? | 20% / 50% / 80% equity |
| **L2 Chokepoint chain** | Within equity, which chain nodes? | NVDA / MSFT / AAPL / … weights |

Theory: [`chokepoint-chain-theory.md`](chokepoint-chain-theory.md) · Map: [`industry-map-us-tech.md`](industry-map-us-tech.md)

---

## L1 Inputs

| Signal | Source (live) | Backtest proxy |
|--------|---------------|----------------|
| Fed stance | `rates_yields`, `macro_indicators`, FOMC news | 10Y Treasury yield 4-week change |
| Risk sentiment | `sentiment_index`, VIX via `global_assets` | VIX level + 20d change |
| Equity trend | `global_assets` ^NDX | Nasdaq-100 (^NDX) vs 200d MA |

## L1 Scoring (−2 … +2)

**Fed score**
- 10Y yield down ≥15bp over 4 weeks → +1 (dovish)
- 10Y yield up ≥15bp → −1 (hawkish)
- else → 0

**Trend score**
- Price above 200d MA → +1
- Below 200d MA → −1

**Sentiment score (live only, optional in backtest)**
- Fear & Greed / sentiment index bullish → +1
- bearish → −1

**L1 Total → equity / cash**

| Total | Regime | Equity / Cash |
|-------|--------|---------------|
| ≥ +2 | RISK-ON | 80% / 20% |
| −1 … +1 | MIXED | 50% / 50% |
| ≤ −2 | RISK-OFF | 20% / 80% |

---

Theory: [`chokepoint-chain-theory.md`](chokepoint-chain-theory.md) · Checklist: [`chokepoint-screening-checklist.md`](chokepoint-screening-checklist.md) · Map: [`industry-map-us-tech.md`](industry-map-us-tech.md)

---

## L2 Chokepoint weights (equity bucket only)

Apply after L1. **Preferred:** full terminal-up screening (A1–A6 + B1–B10, see checklist).  
**Fallback:** regime defaults below when evidence incomplete.

**Hard rules**
- A hits <3 → exclude from overweight  
- B10 = valuation exhausted → **cap weight** (even if bottleneck real)  
- Non-tokenizable upstream node → document proxy; do not pretend direct exposure  

| Symbol | RISK-ON | MIXED | RISK-OFF |
|--------|---------|-------|----------|
| NVDA | 35% | 25% | 10% |
| MSFT | 20% | 30% | 35% |
| AAPL | 15% | 25% | 35% |
| AMZN | 10% | 12% | 12% |
| META | 20% | 8% | 8% |

Worked example with ten-dimension scores: [`../outputs/live/05-terminal-up-chokepoint-screening.md`](../outputs/live/05-terminal-up-chokepoint-screening.md)

**Portfolio weight** = L1 equity % × L2 symbol %

Example (MIXED): NVDA = 50% × 25% = **12.5%** of total portfolio.

---

## Rebalance

- L1 regime change OR L2 dominant chokepoint shift OR monthly → rebalance
- Backtest script uses L1 only (^NDX proxy); L2 documented for live Agent
