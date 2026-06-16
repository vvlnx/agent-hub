import { createHash } from "node:crypto";
import {
  BITGET_STOCK_API_ENDPOINTS,
  fetchBitgetDailyCandles,
  type BitgetCandle,
} from "./bitgetStocks";
import type { Company, ThroatRole } from "./types";

export interface EquityPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

export interface PortfolioMetrics {
  total_return_pct: number;
  benchmark_return_pct: number;
  max_drawdown_pct: number;
  volatility_pct: number;
  alpha_pct: number;
  sharpe_ratio: number;
}

export interface HoldingPerformance {
  ticker: string;
  bitget_symbol: string;
  name: string;
  throat_role: ThroatRole;
  weight_pct: number;
  total_return_pct: number;
}

export interface RoleComparison {
  role: ThroatRole;
  tickers: string[];
  total_return_pct: number;
  avg_monthly_return_pct: number;
}

export interface SimulatedTrade {
  timestamp: string;
  symbol: string;
  side: "BUY" | "SELL";
  action: "ENTRY" | "REBALANCE" | "STOP_LOSS";
  quantity: number;
  price: number;
  notional_usdt: number;
  fee_usdt: number;
  portfolio_value_after_usdt: number;
  cash_after_usdt: number;
  reason: string;
}

export interface RiskPolicy {
  max_position_weight_pct: number;
  trailing_stop_loss_pct: number;
  rebalance_interval_observations: number;
  minimum_trade_usdt: number;
}

export interface RiskSummary {
  initial_cash_weight_pct: number;
  final_cash_weight_pct: number;
  rebalance_events: number;
  stop_loss_events: number;
  total_fees_usdt: number;
}

export interface BacktestEvidence {
  schema_version: "throatscan-bitget-evidence-v1";
  selected_company_tickers: string[];
  holdings: Array<{
    symbol: string;
    candles: BitgetCandle[];
  }>;
  benchmark: {
    symbol: string;
    candles: BitgetCandle[];
  };
}

export interface BacktestSelectionContext {
  methodology: "current-evidence-selection-historical-validation";
  selected_candidates: Array<{
    ticker: string;
    base_score: number;
    confidence_delta: number;
    adjusted_score: number;
    recommended_action: string;
  }>;
  disclosure: string;
}

export interface BacktestValidation {
  status: "verified" | "unavailable";
  data_source: "Bitget Public API";
  period: string;
  allocation: string;
  rebalance: string;
  benchmark_symbol: string;
  metrics: PortfolioMetrics;
  equity_curve: EquityPoint[];
  holdings: HoldingPerformance[];
  bottleneck_strategy_score: number;
  role_comparison: RoleComparison[];
  validation_summary: string;
  trade_log: SimulatedTrade[];
  risk_policy: RiskPolicy;
  risk_summary: RiskSummary;
  evidence_hash?: string;
  evidence: BacktestEvidence;
  selection_context: BacktestSelectionContext;
  api_calls: string[];
  warnings: string[];
  generated_at: string;
}

interface HoldingSeries {
  company: Company;
  symbol: string;
  feeRate: number;
  candles: BitgetCandle[];
  closeByDate: Map<string, number>;
}

interface SimulatedPosition {
  quantity: number;
  peakPrice: number;
  stopped: boolean;
}

interface RiskManagedSimulation {
  equityCurve: EquityPoint[];
  tradeLog: SimulatedTrade[];
  targetWeight: number;
  riskSummary: RiskSummary;
}

const INITIAL_CAPITAL_USDT = 10_000;
const BENCHMARK_SYMBOL = "SPYONUSDT";
const MIN_CANDLES = 5;
const RISK_POLICY: RiskPolicy = {
  max_position_weight_pct: 40,
  trailing_stop_loss_pct: 15,
  rebalance_interval_observations: 20,
  minimum_trade_usdt: 10,
};

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function emptyMetrics(): PortfolioMetrics {
  return {
    total_return_pct: 0,
    benchmark_return_pct: 0,
    max_drawdown_pct: 0,
    volatility_pct: 0,
    alpha_pct: 0,
    sharpe_ratio: 0,
  };
}

function totalReturn(start: number, end: number): number {
  return start > 0 ? ((end - start) / start) * 100 : 0;
}

function maxDrawdown(points: EquityPoint[]): number {
  let peak = points[0]?.portfolio ?? 100;
  let maximum = 0;
  for (const point of points) {
    peak = Math.max(peak, point.portfolio);
    maximum = Math.max(maximum, peak > 0 ? (peak - point.portfolio) / peak : 0);
  }
  return round(maximum * 100);
}

function dailyReturns(values: number[]): number[] {
  return values.slice(1).map((value, index) => {
    const previous = values[index];
    return previous > 0 ? value / previous - 1 : 0;
  });
}

function annualizedVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(252) * 100);
}

function sharpeRatio(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  const deviation = Math.sqrt(variance);
  return deviation > 0 ? round((mean / deviation) * Math.sqrt(252)) : 0;
}

function annualizedReturn(totalReturnPct: number, observations: number): number {
  if (observations <= 0) return 0;
  return ((1 + totalReturnPct / 100) ** (252 / observations) - 1) * 100;
}

function commonDates(series: HoldingSeries[], benchmark: BitgetCandle[]): string[] {
  const benchmarkDates = new Set(benchmark.map((candle) => candle.date));
  return [...benchmarkDates]
    .filter((date) => series.every((holding) => holding.closeByDate.has(date)))
    .sort();
}

function roleComparisons(holdings: HoldingPerformance[]): RoleComparison[] {
  const roles: ThroatRole[] = [
    "CORE BOTTLENECK",
    "STRATEGIC ENABLER",
    "DOWNSTREAM USER",
    "PERIPHERAL EXPOSURE",
  ];

  return roles
    .map((role) => {
      const rows = holdings.filter((holding) => holding.throat_role === role);
      const basket =
        rows.reduce((sum, holding) => sum + holding.total_return_pct, 0) /
        Math.max(rows.length, 1);
      return {
        role,
        tickers: rows.map((holding) => holding.ticker),
        total_return_pct: round(basket),
        avg_monthly_return_pct: round(basket / 3, 3),
      };
    })
    .filter((row) => row.tickers.length > 0);
}

function strategyScore(comparisons: RoleComparison[]): number {
  const core = comparisons.find((row) => row.role === "CORE BOTTLENECK")?.total_return_pct ?? 0;
  const other = comparisons.find((row) => row.role === "STRATEGIC ENABLER")?.total_return_pct ?? 0;
  return round(Math.min(100, Math.max(0, 50 + (core - other) * 1.8)));
}

function simulateRiskManagedPortfolio(
  series: HoldingSeries[],
  dates: string[],
  benchmarkByDate: Map<string, number>,
): RiskManagedSimulation {
  const targetWeight = Math.min(
    1 / series.length,
    RISK_POLICY.max_position_weight_pct / 100,
  );
  const positions = new Map<string, SimulatedPosition>(
    series.map((holding) => [
      holding.symbol,
      {
        quantity: 0,
        peakPrice: holding.closeByDate.get(dates[0])!,
        stopped: false,
      },
    ]),
  );
  let cash = INITIAL_CAPITAL_USDT;
  const tradeLog: SimulatedTrade[] = [];
  const firstDate = dates[0];
  const benchmarkStart = benchmarkByDate.get(firstDate)!;

  const portfolioValue = (date: string) =>
    cash +
    series.reduce((sum, holding) => {
      const position = positions.get(holding.symbol)!;
      return sum + position.quantity * holding.closeByDate.get(date)!;
    }, 0);

  const recordTrade = (
    holding: HoldingSeries,
    date: string,
    side: SimulatedTrade["side"],
    action: SimulatedTrade["action"],
    quantity: number,
    reason: string,
  ) => {
    const price = holding.closeByDate.get(date)!;
    const notional = quantity * price;
    const fee = notional * holding.feeRate;
    const position = positions.get(holding.symbol)!;
    if (side === "BUY") {
      position.quantity += quantity;
      cash -= notional + fee;
    } else {
      position.quantity -= quantity;
      cash += notional - fee;
    }
    tradeLog.push({
      timestamp: `${date}T00:00:00.000Z`,
      symbol: holding.symbol,
      side,
      action,
      quantity: round(quantity, 6),
      price,
      notional_usdt: round(notional),
      fee_usdt: round(fee, 4),
      portfolio_value_after_usdt: round(portfolioValue(date)),
      cash_after_usdt: round(cash),
      reason,
    });
  };

  for (const holding of series) {
    const price = holding.closeByDate.get(firstDate)!;
    const targetNotional = INITIAL_CAPITAL_USDT * targetWeight;
    const affordableNotional = cash / (1 + holding.feeRate);
    const notional = Math.min(targetNotional / (1 + holding.feeRate), affordableNotional);
    recordTrade(
      holding,
      firstDate,
      "BUY",
      "ENTRY",
      notional / price,
      holding.company.event_adjustment
        ? `Current-evidence selection: ${holding.company.ticker} adjusted confidence ${holding.company.event_adjustment.adjusted_score} (${holding.company.event_adjustment.confidence_delta >= 0 ? "+" : ""}${holding.company.event_adjustment.confidence_delta}); historical validation only; target weight ${round(targetWeight * 100)}%.`
        : `Risk-capped entry after ThroatScan selected ${holding.company.ticker}; target weight ${round(targetWeight * 100)}%.`,
    );
  }

  const equityCurve = dates.map((date, index) => {
    if (index > 0) {
      for (const holding of series) {
        const position = positions.get(holding.symbol)!;
        if (position.stopped || position.quantity <= 0) continue;
        const price = holding.closeByDate.get(date)!;
        position.peakPrice = Math.max(position.peakPrice, price);
        const stopPrice = position.peakPrice * (1 - RISK_POLICY.trailing_stop_loss_pct / 100);
        if (price <= stopPrice) {
          const quantity = position.quantity;
          position.stopped = true;
          recordTrade(
            holding,
            date,
            "SELL",
            "STOP_LOSS",
            quantity,
            `${RISK_POLICY.trailing_stop_loss_pct}% trailing stop triggered at ${round(price)} versus peak ${round(position.peakPrice)}.`,
          );
        }
      }

      if (index % RISK_POLICY.rebalance_interval_observations === 0) {
        const equityBefore = portfolioValue(date);
        const adjustments = series
          .filter((holding) => !positions.get(holding.symbol)!.stopped)
          .map((holding) => {
            const position = positions.get(holding.symbol)!;
            const price = holding.closeByDate.get(date)!;
            return {
              holding,
              delta: equityBefore * targetWeight - position.quantity * price,
            };
          });

        for (const { holding, delta } of adjustments.filter((item) => item.delta < 0)) {
          if (Math.abs(delta) < RISK_POLICY.minimum_trade_usdt) continue;
          const price = holding.closeByDate.get(date)!;
          recordTrade(
            holding,
            date,
            "SELL",
            "REBALANCE",
            Math.abs(delta) / price,
            `Periodic rebalance back to ${round(targetWeight * 100)}% max-risk target.`,
          );
        }
        for (const { holding, delta } of adjustments.filter((item) => item.delta > 0)) {
          if (delta < RISK_POLICY.minimum_trade_usdt) continue;
          const affordableNotional = cash / (1 + holding.feeRate);
          const notional = Math.min(delta, affordableNotional);
          if (notional < RISK_POLICY.minimum_trade_usdt) continue;
          const price = holding.closeByDate.get(date)!;
          recordTrade(
            holding,
            date,
            "BUY",
            "REBALANCE",
            notional / price,
            `Periodic rebalance back to ${round(targetWeight * 100)}% max-risk target.`,
          );
        }
      }
    }

    return {
      date,
      portfolio: round((portfolioValue(date) / INITIAL_CAPITAL_USDT) * 100),
      benchmark: round(100 * (benchmarkByDate.get(date)! / benchmarkStart)),
    };
  });
  const finalValue = portfolioValue(dates.at(-1)!);
  const rebalanceEvents = new Set(
    tradeLog.filter((trade) => trade.action === "REBALANCE").map((trade) => trade.timestamp),
  ).size;

  return {
    equityCurve,
    tradeLog,
    targetWeight,
    riskSummary: {
      initial_cash_weight_pct: round(
        Math.max(0, 100 - targetWeight * series.length * 100),
      ),
      final_cash_weight_pct: round((cash / finalValue) * 100),
      rebalance_events: rebalanceEvents,
      stop_loss_events: tradeLog.filter((trade) => trade.action === "STOP_LOSS").length,
      total_fees_usdt: round(tradeLog.reduce((sum, trade) => sum + trade.fee_usdt, 0), 4),
    },
  };
}

function unavailableBacktest(warnings: string[]): BacktestValidation {
  return {
    status: "unavailable",
    data_source: "Bitget Public API",
    period: "Unavailable",
    allocation: "No Bitget-tradable holdings with sufficient candle history",
    rebalance: "Not run",
    benchmark_symbol: BENCHMARK_SYMBOL,
    metrics: emptyMetrics(),
    equity_curve: [],
    holdings: [],
    bottleneck_strategy_score: 0,
    role_comparison: [],
    validation_summary:
      "Verifiable backtest withheld because Bitget candle coverage is insufficient for the selected companies.",
    trade_log: [],
    risk_policy: RISK_POLICY,
    risk_summary: {
      initial_cash_weight_pct: 100,
      final_cash_weight_pct: 100,
      rebalance_events: 0,
      stop_loss_events: 0,
      total_fees_usdt: 0,
    },
    evidence: {
      schema_version: "throatscan-bitget-evidence-v1",
      selected_company_tickers: [],
      holdings: [],
      benchmark: {
        symbol: BENCHMARK_SYMBOL,
        candles: [],
      },
    },
    selection_context: {
      methodology: "current-evidence-selection-historical-validation",
      selected_candidates: [],
      disclosure:
        "Current evidence selects today's candidate basket; historical Bitget candles validate the basket without back-propagating current news.",
    },
    api_calls: [BITGET_STOCK_API_ENDPOINTS.symbols, BITGET_STOCK_API_ENDPOINTS.candles],
    warnings,
    generated_at: new Date().toISOString(),
  };
}

export async function runBacktestValidation(topCompanies: Company[]): Promise<BacktestValidation> {
  const candidates = topCompanies
    .filter(
      (company) =>
        company.bitget_market?.listed &&
        company.bitget_market.status === "online" &&
        company.bitget_market.symbol,
    )
    .slice(0, 5);

  if (candidates.length === 0) {
    return unavailableBacktest([
      "None of the selected companies map to an online Bitget tokenized-stock symbol.",
    ]);
  }

  const [holdingResults, benchmarkResult] = await Promise.all([
    Promise.allSettled(
      candidates.map(async (company): Promise<HoldingSeries> => {
        const symbol = company.bitget_market!.symbol!;
        const candles = await fetchBitgetDailyCandles(symbol);
        return {
          company,
          symbol,
          feeRate: company.bitget_market?.taker_fee_rate ?? 0.001,
          candles,
          closeByDate: new Map(candles.map((candle) => [candle.date, candle.close])),
        };
      }),
    ),
    Promise.allSettled([fetchBitgetDailyCandles(BENCHMARK_SYMBOL)]),
  ]);
  const benchmark =
    benchmarkResult[0]?.status === "fulfilled" ? benchmarkResult[0].value : [];
  const series = holdingResults
    .filter((result): result is PromiseFulfilledResult<HoldingSeries> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((holding) => holding.candles.length >= MIN_CANDLES);
  const warnings = holdingResults
    .flatMap((result, index) =>
      result.status === "rejected"
        ? [`Could not fetch Bitget candles for ${candidates[index]?.ticker ?? "unknown"}.`]
        : result.value.candles.length < MIN_CANDLES
          ? [`Insufficient Bitget candles for ${result.value.symbol}.`]
          : [],
    );

  if (series.length === 0 || benchmark.length < MIN_CANDLES) {
    return unavailableBacktest([
      ...warnings,
      benchmark.length < MIN_CANDLES
        ? `Insufficient Bitget candles for benchmark ${BENCHMARK_SYMBOL}.`
        : "",
    ].filter(Boolean));
  }

  const dates = commonDates(series, benchmark);
  if (dates.length < MIN_CANDLES) {
    return unavailableBacktest([
      ...warnings,
      "Selected holdings and benchmark do not have enough overlapping Bitget candle dates.",
    ]);
  }

  const benchmarkByDate = new Map(benchmark.map((candle) => [candle.date, candle.close]));
  const firstDate = dates[0];
  const lastDate = dates.at(-1)!;
  const simulation = simulateRiskManagedPortfolio(series, dates, benchmarkByDate);
  const equity_curve = simulation.equityCurve;
  const portfolioValues = equity_curve.map((point) => point.portfolio);
  const returns = dailyReturns(portfolioValues);
  const total_return_pct = round(totalReturn(100, portfolioValues.at(-1)!));
  const benchmark_return_pct = round(
    totalReturn(100, equity_curve.at(-1)!.benchmark),
  );
  const metrics: PortfolioMetrics = {
    total_return_pct,
    benchmark_return_pct,
    max_drawdown_pct: maxDrawdown(equity_curve),
    volatility_pct: annualizedVolatility(returns),
    alpha_pct: round(
      annualizedReturn(total_return_pct, returns.length) -
        annualizedReturn(benchmark_return_pct, returns.length),
    ),
    sharpe_ratio: sharpeRatio(returns),
  };
  const weightPct = round(simulation.targetWeight * 100);
  const holdings: HoldingPerformance[] = series.map((holding) => ({
    ticker: holding.company.ticker,
    bitget_symbol: holding.symbol,
    name: holding.company.name,
    throat_role: holding.company.throat_role,
    weight_pct: weightPct,
    total_return_pct: round(
      totalReturn(
        holding.closeByDate.get(firstDate)!,
        holding.closeByDate.get(lastDate)!,
      ) - holding.feeRate * 100,
    ),
  }));
  const trade_log = simulation.tradeLog;
  const role_comparison = roleComparisons(holdings);
  const bottleneck_strategy_score = strategyScore(role_comparison);
  const evidence: BacktestEvidence = {
    schema_version: "throatscan-bitget-evidence-v1",
    selected_company_tickers: series.map((holding) => holding.company.ticker),
    holdings: series.map((holding) => ({
      symbol: holding.symbol,
      candles: holding.candles,
    })),
    benchmark: {
      symbol: BENCHMARK_SYMBOL,
      candles: benchmark,
    },
  };
  const evidence_hash = createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
  const selection_context: BacktestSelectionContext = {
    methodology: "current-evidence-selection-historical-validation",
    selected_candidates: series.map((holding) => ({
      ticker: holding.company.ticker,
      base_score: holding.company.event_adjustment?.base_score ?? holding.company.score,
      confidence_delta: holding.company.event_adjustment?.confidence_delta ?? 0,
      adjusted_score: holding.company.event_adjustment?.adjusted_score ?? holding.company.score,
      recommended_action:
        holding.company.event_adjustment?.recommended_action ?? "SIMULATED_BUY",
    })),
    disclosure:
      "Current evidence selects today's candidate basket; historical Bitget candles validate the basket without back-propagating current news.",
  };

  return {
    status: "verified",
    data_source: "Bitget Public API",
    period: `${firstDate} to ${lastDate} (${dates.length} daily observations)`,
    allocation: `Risk-capped ${weightPct}% × ${series.length} Bitget stock tokens; remainder held as cash`,
    rebalance: `Every ${RISK_POLICY.rebalance_interval_observations} common observations; ${RISK_POLICY.trailing_stop_loss_pct}% trailing stop`,
    benchmark_symbol: BENCHMARK_SYMBOL,
    metrics,
    equity_curve,
    holdings,
    bottleneck_strategy_score,
    role_comparison,
    validation_summary: `Verifiable Bitget-candle simulation returned ${total_return_pct}% vs ${BENCHMARK_SYMBOL} ${benchmark_return_pct}%. Evidence hash: ${evidence_hash.slice(0, 12)}.`,
    trade_log,
    risk_policy: RISK_POLICY,
    risk_summary: simulation.riskSummary,
    evidence_hash,
    evidence,
    selection_context,
    api_calls: [
      BITGET_STOCK_API_ENDPOINTS.symbols,
      BITGET_STOCK_API_ENDPOINTS.tickers,
      BITGET_STOCK_API_ENDPOINTS.candles,
    ],
    warnings,
    generated_at: new Date().toISOString(),
  };
}
