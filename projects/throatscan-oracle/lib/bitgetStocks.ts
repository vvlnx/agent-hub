import type { Company } from "./types";
import {
  buildEquityEvidence,
  legacyMarketFromEvidence,
  resolveTradability,
} from "./equity";
import type { BitgetEquityEvidence } from "./equity/types";

export interface BitgetStockMarketEvidence {
  source: "Bitget Public API";
  underlying_ticker: string;
  symbol?: string;
  listed: boolean;
  status: "online" | "offline" | "not_listed";
  last_price?: number;
  quote_volume_24h?: number;
  bid_price?: number;
  ask_price?: number;
  spread_bps?: number;
  min_trade_usdt?: number;
  maker_fee_rate?: number;
  taker_fee_rate?: number;
  market_timestamp?: string;
  fetched_at: string;
  error_message?: string;
}

export interface BitgetCandle {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  base_volume: number;
  quote_volume: number;
}

export const BITGET_STOCK_API_ENDPOINTS = {
  symbols: "/api/v2/spot/public/symbols",
  tickers: "/api/v2/spot/market/tickers",
  candles: "/api/v2/spot/market/candles",
} as const;

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      "cause" in error && error.cause instanceof Error ? `: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
  }
  return "Unknown Bitget request failure";
}

export async function attachBitgetEquityEvidence(companies: Company[]): Promise<Company[]> {
  const fetchedAt = new Date().toISOString();

  return Promise.all(
    companies.map(async (company) => {
      try {
        const resolution = await resolveTradability(company.ticker);
        const bitget_equity = buildEquityEvidence(resolution, fetchedAt);
        return {
          ...company,
          analysis_grade: bitget_equity.analysis_grade,
          bitget_equity,
          bitget_market: legacyMarketFromEvidence(bitget_equity),
        };
      } catch (error) {
        const bitget_equity: BitgetEquityEvidence = {
          underlying_ticker: company.ticker.toUpperCase(),
          execution_tier: "C",
          evidence_grade: "unavailable",
          analysis_grade: "deep",
          instruments: [],
          fetched_at: fetchedAt,
          error_message: errorMessage(error),
        };
        return {
          ...company,
          analysis_grade: bitget_equity.analysis_grade,
          bitget_equity,
          bitget_market: legacyMarketFromEvidence(bitget_equity),
        };
      }
    }),
  );
}

/** @deprecated Use attachBitgetEquityEvidence */
export async function attachBitgetStockEvidence(companies: Company[]): Promise<Company[]> {
  return attachBitgetEquityEvidence(companies);
}

export async function fetchBitgetDailyCandles(
  symbol: string,
  limit = 180,
): Promise<BitgetCandle[]> {
  const { request, EnvHttpProxyAgent, ProxyAgent } = await import("undici");
  const BITGET_API_BASE_URL = "https://api.bitget.com";
  const REQUEST_TIMEOUT_MS = 12_000;
  const configuredProxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy;
  const dispatcher = configuredProxy ? new ProxyAgent(configuredProxy) : new EnvHttpProxyAgent();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await request(
      `${BITGET_API_BASE_URL}/api/v2/spot/market/candles?symbol=${encodeURIComponent(symbol)}&granularity=1day&limit=${limit}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        dispatcher,
      },
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Bitget request failed with HTTP ${response.statusCode}`);
    }
    const body = (await response.body.json()) as { code: string; msg: string; data: string[][] };
    if (body.code !== "00000") {
      throw new Error(`Bitget request failed: ${body.code} ${body.msg}`);
    }

    return body.data
      .map((row) => ({
        timestamp: Number(row[0]),
        date: new Date(Number(row[0])).toISOString().slice(0, 10),
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
        base_volume: Number(row[5]),
        quote_volume: Number(row[6]),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.timestamp) &&
          Number.isFinite(row.close) &&
          row.close > 0,
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  } finally {
    clearTimeout(timeout);
  }
}
