# Live Agent Output — Prompt 3: Fed Rebalance Table

**Date:** 2026-06-12  
**Rules:** `strategy/rules.md`  
**Current regime:** **MIXED**

---

## Fed Signal Summary

| Input | Value | Rule score |
|-------|-------|------------|
| 10Y yield 4w change | +2.6 bp | Fed: 0 (neutral) |
| Nasdaq vs 200d MA | 29,636 > 25,698 | Trend: +1 |
| **Total** | | **+1 → MIXED** |

---

## Rebalance Decision

**Action:** **HOLD** — no trade required (already at target weights)

---

## Portfolio Table (Tokenized US Tech Basket)

| Symbol (tokenized proxy) | Current % | Target % | Action |
|--------------------------|-----------|----------|--------|
| NDX / Tech basket | 50% | 50% | HOLD |
| USDT (cash) | 50% | 50% | HOLD |

### Optional single-name breakdown (illustrative)

| Symbol | Current % | Target % | Action |
|--------|-----------|----------|--------|
| AAPL token | 15% | 15% | HOLD |
| NVDA token | 20% | 20% | HOLD |
| MSFT token | 15% | 15% | HOLD |
| Cash | 50% | 50% | HOLD |

---

## Next Rebalance Triggers

| Event | New regime | Target equity % |
|-------|------------|-----------------|
| 10Y −15bp+ (4w) + above 200d MA | RISK-ON | 80% |
| 10Y +15bp+ (4w) or below 200d MA | RISK-OFF | 20% |
| Monthly review | Re-evaluate | Per score |

---

## Offline Backtest Validation

See `outputs/backtest_summary.json`:

- Total return (2020–2026): **+118.08%**
- Max drawdown: **−13.81%**
- Sharpe (approx.): **1.30**
- Regime changes: **127**

Same rule engine; live layer uses Bitget Agent Hub market-data + Skills.
