# Demo Package — Ready for Submission

Generated: 2026-06-14

## What's included

| File | Purpose |
|------|---------|
| `live/01-macro-snapshot.md` | Prompt 1 — macro + RISK verdict |
| `live/02-macro-sentiment-allocation.md` | Prompt 2 — allocation % |
| `live/03-fed-rebalance-table.md` | Prompt 3 — rebalance table |
| `live/snapshot.json` | Machine-readable market snapshot |
| `backtest_summary.json` | Historical backtest evidence |

## Current verdict (2026-06-12 data)

- **Regime:** MIXED 🟡
- **Allocation:** 50% tokenized US tech / 50% cash
- **Action:** HOLD

## Backtest (2020-01-01 → 2026-06-12)

- Total return: **+118.08%**
- Max drawdown: **−13.81%**
- Sharpe: **1.30**

## Re-run

```bash
cd projects/fed-us-stock-agent
python3 scripts/backtest_fed_nasdaq.py
```

## Record demo video

1. Open `01-macro-snapshot.md` → explain MIXED verdict  
2. Open `02-macro-sentiment-allocation.md` → 50/50 allocation  
3. Open `backtest_summary.json` → show metrics  
