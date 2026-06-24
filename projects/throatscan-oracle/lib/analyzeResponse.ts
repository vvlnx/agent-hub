import type { BacktestValidation } from "./backtest";
import type { AnalysisResult } from "./mockData";

export function slimBacktestForClient(backtest: BacktestValidation): BacktestValidation {
  const { evidence, ...rest } = backtest;
  return {
    ...rest,
    evidence: {
      schema_version: evidence.schema_version,
      selected_company_tickers: evidence.selected_company_tickers,
      holdings: evidence.holdings.map((holding) => ({
        symbol: holding.symbol,
        candles: [],
        candle_count: holding.candles.length,
        period_start: holding.candles[0]?.date,
        period_end: holding.candles.at(-1)?.date,
      })),
      benchmark: {
        symbol: evidence.benchmark.symbol,
        candles: [],
        candle_count: evidence.benchmark.candles.length,
        period_start: evidence.benchmark.candles[0]?.date,
        period_end: evidence.benchmark.candles.at(-1)?.date,
      },
    },
  };
}

export function slimAnalysisForClient(result: AnalysisResult): AnalysisResult {
  return {
    ...result,
    backtest: slimBacktestForClient(result.backtest),
  };
}
