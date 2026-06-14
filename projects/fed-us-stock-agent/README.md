# Fed Signal Agent for Tokenized US Tech

> **Bitget AI Base Camp Hackathon S1 — Track 3: US Stock AI Trading**

An AI Agent that reads **Fed rate signals** and **market sentiment**, applies **Chokepoint Industry Chain Decomposition (咽喉拆解产业链)**, and recommends **two-layer allocations** (macro risk budget + intra-equity chokepoint weights) for tokenized US tech — built on **Bitget Agent Hub** (no Playbook required).

---

## Problem

Tokenized US equities (e.g. AAPL, NVDA, MSFT on-chain) move sharply with Fed policy and risk sentiment. Most traders also fail to map macro views onto **which chain node** (compute, cloud, ecosystem) to overweight. This project closes **macro → chokepoint chain → symbol weights** using Bitget Agent Hub.

### Analytical theory: 咽喉拆解产业链 (CICD)

| Layer | Question | Doc |
|-------|----------|-----|
| **L0 Terminal** | 真实终端需求从哪来？ | 量、增速、持续时间 |
| **L1 Macro** | 承担多少 equity 风险？ | Fed + sentiment → 20/50/80% |
| **L2 Chokepoint** | 押哪个咽喉节点？ | **终端向上拆解** + 六类硬咽喉 + **十维核实** |

Method: start from **end demand**, walk **upstream**; prioritize nodes that are hard to substitute, slow to expand, long certification, few suppliers, capacity/geo constrained, and **under-attended**.

Checklist: [`strategy/chokepoint-screening-checklist.md`](strategy/chokepoint-screening-checklist.md)  
Theory: [`strategy/chokepoint-chain-theory.md`](strategy/chokepoint-chain-theory.md)

**Covers three official Track 3 directions:**

| Direction | Implementation |
|-----------|----------------|
| Macro/sentiment Agent for tokenized US assets | `macro-analyst` + `sentiment-analyst` + `market-data` MCP |
| Backtest on US stock historical data | `scripts/backtest_fed_nasdaq.py` → `outputs/backtest_summary.json` |
| Fed signals → auto-rebalance | Shared rules in `strategy/rules.md` → live allocation + rebalance table |

---

## Latest Results

**Live snapshot (2026-06-12)**

| Item | Value |
|------|-------|
| Regime | **MIXED 🟡** |
| Allocation | **50%** tokenized US tech / **50%** cash |
| Action | **HOLD** (no rebalance) |
| Nasdaq 100 | 29,635.95 (above 200d MA 25,698) |
| US 10Y yield | 4.49% (+2.6 bp / 4w) |
| VIX | 17.68 |

**Backtest (2020-01-01 → 2026-06-12)**

| Metric | Value |
|--------|-------|
| Total return | **+118.08%** |
| Max drawdown | **−13.81%** |
| Sharpe (approx.) | **1.30** |
| Regime changes | 127 |
| Final regime | MIXED |

Full live outputs: [`outputs/live/`](outputs/live/) · Backtest JSON: [`outputs/backtest_summary.json`](outputs/backtest_summary.json)

### Local demo dashboard (网页)

Double-click or run:

```bash
cd projects/fed-us-stock-agent
open docs/index.html
# or: ./open-dashboard.sh
```

Opens a tabbed HTML report in your browser — no server required.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  User (natural language)                                  │
└────────────────────────────┬─────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────┐
│  Cursor Agent + Bitget Skill Hub                          │
│  • macro-analyst    • sentiment-analyst                   │
└────────────────────────────┬─────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────┐
│  market-data MCP (Bitget)                                 │
│  rates_yields · macro_indicators · global_assets ·        │
│  sentiment_index · news_feed                              │
└────────────────────────────┬─────────────────────────────┘
                             ▼
              RISK-ON / MIXED / RISK-OFF (L1)
                             ↓
┌──────────────────────────────────────────────────────────┐
│  Chokepoint chain (L2) — 咽喉拆解产业链                      │
│  NVDA · MSFT · AAPL · AMZN · META weights inside equity   │
└────────────────────────────┬─────────────────────────────┘
                             ▼
                   Symbol-level rebalance table

┌──────────────────────────────────────────────────────────┐
│  Offline validation (L1 rules; L2 live Agent)             │
│  scripts/backtest_fed_nasdaq.py → backtest_summary.json    │
└──────────────────────────────────────────────────────────┘
```

**Bitget modules used**

| Module | Role |
|--------|------|
| `market-data` MCP | Fed, yields, Nasdaq/S&P, sentiment, news |
| Skill Hub | `macro-analyst`, `sentiment-analyst` |
| `bitget` MCP (optional) | `spot_get_ticker`, account queries for tokenized symbols |

> Playbook was unavailable during development. Live analysis uses Agent Hub; historical validation uses the same rule engine in Python.

---

## Repository Structure

```
.
├── README.md                          # This file
├── LICENSE                            # MIT
├── .gitignore
├── prompts.txt                        # Copy-paste Agent prompts
├── requirements.txt                   # Python deps for backtest
├── strategy/
│   ├── rules.md                       # L1 macro + L2 chokepoint weights
│   ├── chokepoint-chain-theory.md     # 终端向上 · 咽喉拆解理论
│   ├── chokepoint-screening-checklist.md  # 六类硬咽喉 + 十维核实
│   └── industry-map-us-tech.md        # US tech chain (L0→L4)
├── docs/
│   └── index.html                     # Local demo dashboard (open in browser)
├── open-dashboard.sh                  # One-click open dashboard (macOS)
├── templates/
│   └── chokepoint-report.md           # Agent output template
├── scripts/
│   └── backtest_fed_nasdaq.py         # Offline backtest
└── outputs/
    ├── backtest_summary.json          # Submission evidence
    ├── DEMO_COMPLETE.md               # Quick demo index
    └── live/
        ├── snapshot.json
        ├── 01-macro-snapshot.md
        ├── 02-macro-sentiment-allocation.md
        └── 03-fed-rebalance-table.md
```

---

## Prerequisites

- [Cursor](https://cursor.com) (or any MCP-compatible Agent IDE)
- Node.js 18+
- Python 3.11+
- Bitget API Key (Read permission sufficient for demo)
- Bitget Agent Hub configured — see [Setup](#setup)

---

## Setup

### 1. Install Bitget Agent Hub

```bash
npx bitget-hub upgrade-all --target claude
npx @bitget-ai/getagent-skill install --client cursor   # optional, for future Playbook
```

### 2. Configure MCP (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "market-data": {
      "url": "https://datahub.noxiaohao.com/mcp"
    },
    "bitget": {
      "command": "npx",
      "args": ["-y", "bitget-mcp-server", "--modules", "spot,account"],
      "env": {
        "BITGET_API_KEY": "your-key",
        "BITGET_SECRET_KEY": "your-secret",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

Restart Cursor (**Cmd+Q**, then reopen). Confirm both MCP servers show **Connected**.

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

---

## Usage

### Live Agent demo

Open **Agent** mode in Cursor. Run prompts from [`prompts.txt`](prompts.txt) **one at a time**:

**① Macro snapshot**
```
Use macro-analyst: full macro snapshot with Fed funds, yield curve, and Nasdaq 100. End with RISK-ON / MIXED / RISK-OFF for tokenized US tech.
```

**② Macro + sentiment allocation**
```
Combine macro-analyst and sentiment-analyst. Should I increase or reduce tokenized US tech exposure today? Give target allocation percentages.
```

**③ Fed rebalance table (L1)**
```
Read latest Fed context via market-data. Apply strategy/rules.md Layer 1. Output rebalance table: regime, equity %, cash %, action.
```

**④ Chokepoint chain — 咽喉拆解 (L2)**
```
Read strategy/chokepoint-chain-theory.md and industry-map-us-tech.md. Score P/M/S for NVDA MSFT AAPL AMZN META. Output using templates/chokepoint-report.md.
```

**⑤ Full stack (L1 + L2)**
```
Run macro + sentiment for Layer 1, then chokepoint chain for Layer 2. Final table: each symbol % of total portfolio + cash.
```

See [`prompts.txt`](prompts.txt). Save Agent replies to `outputs/live/`.

### Run backtest

```bash
python scripts/backtest_fed_nasdaq.py
```

Output: `outputs/backtest_summary.json`

---

## Strategy Rules (summary)

Full spec: [`strategy/rules.md`](strategy/rules.md) · Theory: [`chokepoint-chain-theory.md`](strategy/chokepoint-chain-theory.md)

**Layer 1 — Macro**

| Total score | Regime | Equity / Cash |
|-------------|--------|---------------|
| ≥ +2 | RISK-ON 🟢 | 80% / 20% |
| −1 … +1 | MIXED 🟡 | 50% / 50% |
| ≤ −2 | RISK-OFF 🔴 | 20% / 80% |

**Layer 2 — Chokepoint (terminal → upstream, equity bucket)**

Screen: 难替代 · 扩产慢 · 认证长 · 供应商少 · 产能/地缘瓶颈 · 低关注  
Verify: 链上位置 · 收入占比 · 客户订单 · 产能认证 · 供需缺口 · 定价权 · 格局 · 替代 · 政策 · **估值透支**

See [`05-terminal-up-chokepoint-screening.md`](outputs/live/05-terminal-up-chokepoint-screening.md) for worked example.

---

## Demo Video Script (≤3 min)

1. **0:00–0:30** — Problem: Fed drives tokenized US tech; manual monitoring is slow  
2. **0:30–1:30** — Open `outputs/live/01-macro-snapshot.md` → explain **MIXED** verdict  
3. **1:30–2:15** — Open `02-macro-sentiment-allocation.md` → **50/50 hold**  
4. **2:15–2:45** — Open `03-fed-rebalance-table.md` → rebalance triggers  
5. **2:45–3:00** — Open `backtest_summary.json` → +118% return, −14% max DD, Sharpe 1.3  

---

## Hackathon Submission

### Project description (≤200 words)

**Fed Signal Agent for Tokenized US Tech**

Tokenized US equities react sharply to Fed policy and risk sentiment, but most traders lack a unified macro-to-allocation workflow. This Agent connects Bitget Agent Hub to solve that gap without manual API integration.

The live loop uses **macro-analyst** and **sentiment-analyst** Skills with the **market-data MCP** to read Fed funds, the yield curve, Nasdaq/S&P context, and sentiment indices, then outputs a **RISK-ON / MIXED / RISK-OFF** verdict and target weights for a tokenized US tech basket. Optional **bitget** spot tools query Bitget-listed tokenized symbols.

Because Playbook access is unavailable, verifiable evidence comes from (1) saved Agent sessions showing end-to-end macro → allocation decisions, and (2) an offline backtest (`scripts/backtest_fed_nasdaq.py`) implementing the same rule table on historical Nasdaq and 10Y yield data, exporting PnL, drawdown, and Sharpe metrics.

**Bitget modules:** market-data MCP, Skill Hub (macro-analyst, sentiment-analyst), bitget MCP (spot, account).

### Checklist

- [ ] GitHub repository link (this repo)
- [ ] Project description above
- [ ] Demo video (optional, ≤3 min)
- [ ] Evidence: `outputs/backtest_summary.json` + `outputs/live/*.md`
- [ ] Repost [official Bitget post](https://x.com/Bitget_AI/status/2062506424085917944) + tag **#BitgetHackathon**

---

## Limitations & Future Work

- Live layer depends on **market-data MCP** availability; backtest uses public Nasdaq + 10Y data as validation
- Playbook integration planned when access is granted (official sandbox backtest)
- Tokenized symbol mapping is illustrative; replace with actual Bitget spot pairs in production

---

## Push to GitHub

```bash
cd projects/fed-us-stock-agent   # or your clone path

git commit -m "Fed Signal Agent for Tokenized US Tech — Track 3"
# Create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/fed-us-stock-agent.git
git push -u origin main
```

Use the GitHub URL as your hackathon **Demo / repository link**.

---

## Links

- [Bitget Agent Hub](https://github.com/BitgetLimited/agent_hub)
- [Hackathon docs](https://bitget-ai.gitbook.io/hackathon/)
- [Hackathon registration](https://www.bitget.com/zh-CN/campaigns/d8a2a61fd63c4bc2a3c8198ec923da9a)

---

## License

MIT
