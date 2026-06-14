# Submission text (≤200 words)

**Fed Signal Agent for Tokenized US Tech**

Tokenized US equities react sharply to Fed policy and risk sentiment, but most traders lack a unified macro-to-allocation workflow. This Agent connects Bitget Agent Hub to solve that gap without manual API integration.

The live loop uses **macro-analyst** and **sentiment-analyst** with **market-data MCP**, then **terminal-up chokepoint screening**: from end demand, decompose upstream; filter nodes that are hard-to-substitute, slow to expand, long certification, oligopolistic, capacity/geo constrained, and under-attended; verify chain position, revenue mix, orders, capacity, supply gap, pricing power, competition, substitutes, policy, and whether valuation is exhausted. Layer 1 sets equity/cash; Layer 2 sets symbol weights with caps when narrative is priced in.

Because Playbook access is unavailable, verifiable evidence comes from (1) saved Agent sessions showing end-to-end macro → allocation decisions, and (2) an offline backtest (`scripts/backtest_fed_nasdaq.py`) implementing the same rule table on historical Nasdaq and 10Y yield data, exporting PnL, drawdown, and Sharpe metrics.

**Bitget modules:** market-data MCP, Skill Hub (macro-analyst, sentiment-analyst), bitget MCP (spot, account).
