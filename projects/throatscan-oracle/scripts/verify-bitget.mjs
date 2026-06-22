import assert from "node:assert/strict";
import { analyzeIndustry } from "../lib/agent.ts";

/** Bitget may list both Ondo (NVDAONUSDT) and rToken (RNVDAUSDT); policy prefers rToken when online. */
const NVDA_EXECUTABLE_SYMBOLS = new Set(["NVDAONUSDT", "RNVDAUSDT"]);

function assertExecutableNvdaSymbol(symbol, label) {
  assert.ok(
    NVDA_EXECUTABLE_SYMBOLS.has(symbol),
    `${label} must map to an online Bitget tokenized NVDA symbol (NVDAONUSDT or RNVDAUSDT), got ${symbol ?? "undefined"}`,
  );
}

const result = await analyzeIndustry("AI chips");
const nvda = result.companies.find((company) => company.ticker === "NVDA");
const backtest = result.backtest;
const research = result.market_research;
const eventIntelligence = result.event_intelligence;

assert.equal(nvda?.bitget_market?.status, "online", "NVDA must be online on Bitget");
assertExecutableNvdaSymbol(nvda?.bitget_market?.symbol, "NVDA");
assert.equal(nvda?.bitget_equity?.execution_tier, "A", "NVDA must be Tier A API-executable");
assert.equal(research.enabled, true, "Agent Hub market research must be enabled");
assert.ok(research.tools_used.includes("news_feed"), "news-briefing workflow must call news_feed");
assert.ok(
  research.tools_used.includes("rates_yields"),
  "macro-analyst workflow must call rates_yields",
);
assert.notEqual(research.macro.status, "unavailable", "Macro evidence must be available");
assert.ok(Object.keys(research.macro.rates).length > 0, "Rates evidence must be present");
assert.ok(
  Object.keys(research.macro.indicators).length > 0,
  "Macro indicator evidence must be present",
);
assert.equal(
  eventIntelligence.company_adjustments.length,
  result.companies.length,
  "Every candidate must have an auditable confidence adjustment",
);
assert.ok(
  eventIntelligence.company_adjustments.every(
    (row) =>
      Number.isFinite(row.base_score) &&
      Number.isFinite(row.adjusted_score) &&
      Math.abs(row.confidence_delta) <= 12,
  ),
  "Confidence adjustments must be finite and capped",
);
assert.ok(
  result.companies.every(
    (company) =>
      company.event_adjustment &&
      company.score === company.event_adjustment.adjusted_score,
  ),
  "Displayed company ranking must use the adjusted score",
);
assert.equal(backtest.status, "verified", "Bitget-candle backtest must be verified");
assert.match(backtest.evidence_hash ?? "", /^[a-f0-9]{64}$/, "Evidence hash must be SHA-256");
assert.ok(backtest.evidence.holdings.length > 0, "Holding candle evidence must be present");
assert.ok(
  backtest.evidence.holdings.every((holding) => /^(R)?[A-Z0-9]+USDT$/.test(holding.symbol)),
  "Each backtest holding must use an online Bitget tokenized-stock symbol",
);
assert.ok(
  backtest.evidence.holdings.every((holding) => holding.candles.length >= 5),
  "Each holding must include sufficient Bitget candles",
);
assert.ok(
  backtest.evidence.benchmark.candles.length >= 5,
  "Benchmark Bitget candles must be present",
);
assert.ok(backtest.trade_log.length > 0, "Simulation trade log must be present");
assert.equal(
  backtest.selection_context.methodology,
  "current-evidence-selection-historical-validation",
  "Backtest must disclose its no-look-ahead selection method",
);
assert.ok(
  backtest.trade_log
    .filter((trade) => trade.action === "ENTRY")
    .every((trade) => trade.reason.includes("historical validation only")),
  "Entry decisions must explain that current evidence is used only for basket selection",
);
assert.equal(
  backtest.risk_policy.max_position_weight_pct,
  40,
  "Simulation must enforce the configured position cap",
);
assert.ok(
  backtest.trade_log.every((trade) => Number.isFinite(trade.portfolio_value_after_usdt)),
  "Every simulated trade must record portfolio state",
);
assert.ok(
  backtest.risk_summary.rebalance_events > 0,
  "Long-enough Bitget history must produce a rebalance decision",
);

console.table(
  backtest.holdings.map((holding) => ({
    ticker: holding.ticker,
    bitget_symbol: holding.bitget_symbol,
    weight_pct: holding.weight_pct,
    return_pct: holding.total_return_pct,
  })),
);
console.log(`NVDA Bitget symbol: ${nvda?.bitget_market?.symbol}`);
console.log(`Period: ${backtest.period}`);
console.log(`Evidence hash: ${backtest.evidence_hash}`);
console.log(`Trade records: ${backtest.trade_log.length}`);
console.log(
  `Agent Hub research: news=${research.news.status}, macro=${research.macro.status}, verdict=${research.macro.verdict}`,
);
console.log(
  `Event decision: events=${eventIntelligence.events.length}, action=${eventIntelligence.simulated_decision.action}, selected=${eventIntelligence.simulated_decision.selected_tickers.join(",")}`,
);
console.log(
  `Risk loop: ${backtest.risk_summary.rebalance_events} rebalance events, ${backtest.risk_summary.stop_loss_events} stop-loss events`,
);
console.log("Bitget evidence verification passed.");
