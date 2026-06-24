import { fetchBitgetDailyCandles } from "./bitgetStocks";
import type { BacktestValidation } from "./backtest";

const BENCHMARK_SYMBOL = "BTCUSDT";
const CANDLE_LIMIT = 180;

export async function hydrateBacktestEvidence(
  backtest: BacktestValidation,
): Promise<BacktestValidation["evidence"]> {
  const holdingSymbols =
    backtest.evidence.holdings.length > 0
      ? backtest.evidence.holdings.map((holding) => holding.symbol)
      : backtest.holdings.map((holding) => holding.bitget_symbol);

  const uniqueSymbols = [...new Set(holdingSymbols.filter(Boolean))];
  const benchmarkSymbol = backtest.evidence.benchmark.symbol || backtest.benchmark_symbol || BENCHMARK_SYMBOL;

  const candleResults = await Promise.allSettled([
    ...uniqueSymbols.map(async (symbol) => ({
      symbol,
      candles: await fetchBitgetDailyCandles(symbol, CANDLE_LIMIT),
    })),
    (async () => ({
      symbol: benchmarkSymbol,
      candles: await fetchBitgetDailyCandles(benchmarkSymbol, CANDLE_LIMIT),
    }))(),
  ]);

  const candlesBySymbol = new Map<string, Awaited<ReturnType<typeof fetchBitgetDailyCandles>>>();
  for (const result of candleResults) {
    if (result.status !== "fulfilled") continue;
    candlesBySymbol.set(result.value.symbol.toUpperCase(), result.value.candles);
  }

  return {
    schema_version: backtest.evidence.schema_version,
    selected_company_tickers: backtest.evidence.selected_company_tickers,
    holdings: uniqueSymbols.map((symbol) => ({
      symbol,
      candles: candlesBySymbol.get(symbol.toUpperCase()) ?? [],
    })),
    benchmark: {
      symbol: benchmarkSymbol,
      candles: candlesBySymbol.get(benchmarkSymbol.toUpperCase()) ?? [],
    },
  };
}
