#!/usr/bin/env python3
"""
Rule-based Fed + trend backtest for Track 3 submission evidence.
Uses public market data; live Agent uses Bitget market-data MCP with the same rules in strategy/rules.md.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs"
OUT.mkdir(parents=True, exist_ok=True)

YIELD_TICKER = "^TNX"  # 10Y yield proxy
NDX_TICKER = "^NDX"


@dataclass
class Regime:
    label: str
    equity_weight: float


def classify_regime(yield_chg_4w: float, above_200ma: bool) -> Regime:
    fed = 1 if yield_chg_4w <= -0.15 else (-1 if yield_chg_4w >= 0.15 else 0)
    trend = 1 if above_200ma else -1
    total = fed + trend
    if total >= 2:
        return Regime("RISK-ON", 0.8)
    if total <= -2:
        return Regime("RISK-OFF", 0.2)
    return Regime("MIXED", 0.5)


def max_drawdown(equity_curve: pd.Series) -> float:
    peak = equity_curve.cummax()
    dd = (equity_curve / peak) - 1.0
    return float(dd.min())


def sharpe_approx(daily_returns: pd.Series) -> float:
    if daily_returns.std() == 0:
        return 0.0
    return float((daily_returns.mean() / daily_returns.std()) * (252**0.5))


def run(start: str = "2020-01-01") -> dict:
    ndx = yf.download(NDX_TICKER, start=start, progress=False)["Close"].squeeze()
    tnx = yf.download(YIELD_TICKER, start=start, progress=False)["Close"].squeeze()

    df = pd.DataFrame({"ndx": ndx, "tnx": tnx}).dropna()
    df["ma200"] = df["ndx"].rolling(200).mean()
    df["tnx_chg_4w"] = df["tnx"] - df["tnx"].shift(20)

    equity = 1.0
    cash = 0.0
    w = 0.5
    curve = []
    trades = 0
    prev_label = None

    for dt, row in df.iterrows():
        if pd.isna(row["ma200"]) or pd.isna(row["tnx_chg_4w"]):
            continue
        regime = classify_regime(float(row["tnx_chg_4w"]), float(row["ndx"]) > float(row["ma200"]))
        if prev_label != regime.label:
            trades += 1
            prev_label = regime.label
        w = regime.equity_weight
        # daily portfolio return: weighted NDX return + cash (0)
        curve.append({"date": dt.strftime("%Y-%m-%d"), "weight": w, "regime": regime.label})

    rets = df.loc[[c["date"] for c in curve], "ndx"].pct_change().fillna(0)
    port_rets = []
    for i, c in enumerate(curve):
        port_rets.append(rets.iloc[i] * c["weight"])
    port = pd.Series(port_rets, index=[c["date"] for c in curve])
    equity_curve = (1 + port).cumprod()

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "start": start,
        "end": curve[-1]["date"] if curve else None,
        "strategy": "Fed yield + Nasdaq 200d MA regime (see strategy/rules.md)",
        "total_return_pct": round((float(equity_curve.iloc[-1]) - 1) * 100, 2),
        "max_drawdown_pct": round(max_drawdown(equity_curve) * 100, 2),
        "sharpe_approx": round(sharpe_approx(port), 2),
        "regime_changes": trades,
        "final_regime": curve[-1]["regime"] if curve else None,
        "note": "Live Agent uses Bitget market-data MCP; this script validates the same rule table offline.",
    }

    out_path = OUT / "backtest_summary.json"
    out_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"\nWrote {out_path}")
    return summary


if __name__ == "__main__":
    run()
