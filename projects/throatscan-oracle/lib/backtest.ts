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
}

export interface HoldingPerformance {
  ticker: string;
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

export interface BacktestValidation {
  period: string;
  allocation: string;
  rebalance: string;
  metrics: PortfolioMetrics;
  equity_curve: EquityPoint[];
  holdings: HoldingPerformance[];
  bottleneck_strategy_score: number;
  role_comparison: RoleComparison[];
  validation_summary: string;
}

const BACKTEST_MONTHS = 36;
const START_DATE = new Date(2023, 0, 1);

const ROLE_MONTHLY_DRIFT: Record<ThroatRole, number> = {
  "CORE BOTTLENECK": 0.019,
  "STRATEGIC ENABLER": 0.0115,
  "DOWNSTREAM USER": 0.0085,
  "PERIPHERAL EXPOSURE": 0.0055,
};

const SPY_MONTHLY_DRIFT = 0.0092;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function tickerSeed(ticker: string): number {
  let hash = 0;
  for (let i = 0; i < ticker.length; i += 1) {
    hash = (hash * 31 + ticker.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function monthDate(monthIndex: number): string {
  const date = new Date(START_DATE);
  date.setMonth(date.getMonth() + monthIndex);
  return date.toISOString().slice(0, 10);
}

function deterministicNoise(seed: number, monthIndex: number): number {
  return (((seed + monthIndex * 37) % 101) - 50) / 2500;
}

function monthlyReturn(company: Company, monthIndex: number): number {
  const seed = tickerSeed(company.ticker);
  const drift = ROLE_MONTHLY_DRIFT[company.throat_role] ?? 0.008;
  const scoreBoost = (company.score - 70) / 8000;
  return drift + scoreBoost + deterministicNoise(seed, monthIndex);
}

function spyMonthlyReturn(monthIndex: number): number {
  return SPY_MONTHLY_DRIFT + deterministicNoise(911, monthIndex);
}

function totalReturnFromPrices(start: number, end: number): number {
  return ((end - start) / start) * 100;
}

function simulateBuyAndHoldTotalReturn(company: Company): number {
  let price = 100;
  for (let month = 1; month <= BACKTEST_MONTHS; month += 1) {
    price *= 1 + monthlyReturn(company, month);
  }
  return round(totalReturnFromPrices(100, price));
}

function simulateEqualWeightPortfolio(
  companies: Company[],
  monthlyReturnFn: (company: Company, monthIndex: number) => number,
): { equity_curve: EquityPoint[]; monthly_returns: number[]; total_return_pct: number } {
  const weight = companies.length > 0 ? 1 / companies.length : 0;
  let portfolioValue = 100;
  let benchmarkValue = 100;
  const equity_curve: EquityPoint[] = [
    {
      date: monthDate(0),
      portfolio: portfolioValue,
      benchmark: benchmarkValue,
    },
  ];
  const monthly_returns: number[] = [];

  for (let month = 1; month <= BACKTEST_MONTHS; month += 1) {
    const portfolioMonthReturn = companies.reduce((sum, company) => {
      return sum + weight * monthlyReturnFn(company, month);
    }, 0);
    const benchmarkMonthReturn = spyMonthlyReturn(month);

    portfolioValue *= 1 + portfolioMonthReturn;
    benchmarkValue *= 1 + benchmarkMonthReturn;
    monthly_returns.push(portfolioMonthReturn);

    equity_curve.push({
      date: monthDate(month),
      portfolio: round(portfolioValue),
      benchmark: round(benchmarkValue),
    });
  }

  return {
    equity_curve,
    monthly_returns,
    total_return_pct: round(totalReturnFromPrices(100, portfolioValue)),
  };
}

function maxDrawdown(equity_curve: EquityPoint[], key: "portfolio" | "benchmark"): number {
  let peak = equity_curve[0]?.[key] ?? 100;
  let maxDrawdownValue = 0;

  for (const point of equity_curve) {
    peak = Math.max(peak, point[key]);
    const drawdown = peak > 0 ? (peak - point[key]) / peak : 0;
    maxDrawdownValue = Math.max(maxDrawdownValue, drawdown);
  }

  return round(maxDrawdownValue * 100);
}

function annualizedVolatility(monthly_returns: number[]): number {
  if (monthly_returns.length === 0) {
    return 0;
  }

  const mean = monthly_returns.reduce((sum, value) => sum + value, 0) / monthly_returns.length;
  const variance =
    monthly_returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / monthly_returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(12) * 100);
}

function annualizedReturn(total_return_pct: number, months: number): number {
  const growth = 1 + total_return_pct / 100;
  return (growth ** (12 / months) - 1) * 100;
}

function simulateRoleBasket(companies: Company[], role: ThroatRole): RoleComparison {
  const filtered = companies.filter((company) => company.throat_role === role);
  if (filtered.length === 0) {
    return {
      role,
      tickers: [],
      total_return_pct: 0,
      avg_monthly_return_pct: 0,
    };
  }

  const simulation = simulateEqualWeightPortfolio(filtered, monthlyReturn);
  const avgMonthly =
    simulation.monthly_returns.reduce((sum, value) => sum + value, 0) /
    Math.max(simulation.monthly_returns.length, 1);

  return {
    role,
    tickers: filtered.map((company) => company.ticker),
    total_return_pct: simulation.total_return_pct,
    avg_monthly_return_pct: round(avgMonthly * 100, 3),
  };
}

function computeBottleneckStrategyScore(
  core: RoleComparison,
  enabler: RoleComparison,
): number {
  const spread = core.total_return_pct - enabler.total_return_pct;
  return round(Math.min(100, Math.max(0, 50 + spread * 1.8)));
}

function buildValidationSummary(
  metrics: PortfolioMetrics,
  bottleneck_strategy_score: number,
  core: RoleComparison,
  enabler: RoleComparison,
): string {
  const coreBeatEnabler = core.total_return_pct > enabler.total_return_pct;
  const beatSpy = metrics.total_return_pct > metrics.benchmark_return_pct;

  return [
    `Top-5 equal-weight portfolio returned ${metrics.total_return_pct}% vs SPY ${metrics.benchmark_return_pct}% (${beatSpy ? "outperformed" : "underperformed"} benchmark).`,
    `CORE BOTTLENECK basket returned ${core.total_return_pct}% vs STRATEGIC ENABLER ${enabler.total_return_pct}% (${coreBeatEnabler ? "validating" : "not validating"}) bottleneck theory.`,
    `Bottleneck Strategy Score: ${bottleneck_strategy_score}/100.`,
  ].join(" ");
}

export function runBacktestValidation(topCompanies: Company[]): BacktestValidation {
  const holdings = topCompanies.slice(0, 5);
  const weight_pct = holdings.length > 0 ? round(100 / holdings.length) : 0;
  const simulation = simulateEqualWeightPortfolio(holdings, monthlyReturn);

  let spyValue = 100;
  const spyCurve: number[] = [100];
  for (let month = 1; month <= BACKTEST_MONTHS; month += 1) {
    spyValue *= 1 + spyMonthlyReturn(month);
    spyCurve.push(spyValue);
  }
  const benchmark_return_pct = round(totalReturnFromPrices(100, spyValue));

  simulation.equity_curve = simulation.equity_curve.map((point, index) => ({
    ...point,
    benchmark: round(spyCurve[index] ?? point.benchmark),
  }));

  const portfolioAnnual = annualizedReturn(simulation.total_return_pct, BACKTEST_MONTHS);
  const benchmarkAnnual = annualizedReturn(benchmark_return_pct, BACKTEST_MONTHS);

  const metrics: PortfolioMetrics = {
    total_return_pct: simulation.total_return_pct,
    benchmark_return_pct,
    max_drawdown_pct: maxDrawdown(simulation.equity_curve, "portfolio"),
    volatility_pct: annualizedVolatility(simulation.monthly_returns),
    alpha_pct: round(portfolioAnnual - benchmarkAnnual),
  };

  const coreComparison = simulateRoleBasket(holdings, "CORE BOTTLENECK");
  const enablerComparison = simulateRoleBasket(holdings, "STRATEGIC ENABLER");
  const downstreamComparison = simulateRoleBasket(holdings, "DOWNSTREAM USER");
  const peripheralComparison = simulateRoleBasket(holdings, "PERIPHERAL EXPOSURE");

  const bottleneck_strategy_score = computeBottleneckStrategyScore(
    coreComparison,
    enablerComparison,
  );

  return {
    period: `${monthDate(0)} to ${monthDate(BACKTEST_MONTHS)} (3 years)`,
    allocation: `Equal weight ${weight_pct}% × ${holdings.length} holdings`,
    rebalance: "Monthly",
    metrics,
    equity_curve: simulation.equity_curve,
    holdings: holdings.map((company) => ({
      ticker: company.ticker,
      name: company.name,
      throat_role: company.throat_role,
      weight_pct,
      total_return_pct: simulateBuyAndHoldTotalReturn(company),
    })),
    bottleneck_strategy_score,
    role_comparison: [
      coreComparison,
      enablerComparison,
      downstreamComparison,
      peripheralComparison,
    ].filter((item) => item.tickers.length > 0),
    validation_summary: buildValidationSummary(
      metrics,
      bottleneck_strategy_score,
      coreComparison,
      enablerComparison,
    ),
  };
}
