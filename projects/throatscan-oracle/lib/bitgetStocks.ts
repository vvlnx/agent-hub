import type { Company } from "./types";
import { getCachedBitgetSymbols, getCachedBitgetTickers } from "./bitgetCache";
import { EnvHttpProxyAgent, ProxyAgent, request } from "undici";

const BITGET_API_BASE_URL = "https://api.bitget.com";
const REQUEST_TIMEOUT_MS = 12_000;
const configuredProxy =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy;
const BITGET_DISPATCHER = configuredProxy
  ? new ProxyAgent(configuredProxy)
  : new EnvHttpProxyAgent();

interface BitgetResponse<T> {
  code: string;
  msg: string;
  data: T;
}

interface BitgetSymbolRecord {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
  minTradeUSDT: string;
  makerFeeRate: string;
  takerFeeRate: string;
}

interface BitgetTickerRecord {
  symbol: string;
  lastPr: string;
  quoteVolume: string;
  bidPr: string;
  askPr: string;
  ts: string;
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

async function bitgetGet<T>(path: string): Promise<T> {
  if (path === "/api/v2/spot/public/symbols") {
    return getCachedBitgetSymbols<T>();
  }
  if (path === "/api/v2/spot/market/tickers") {
    return getCachedBitgetTickers<T>();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await request(`${BITGET_API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      dispatcher: BITGET_DISPATCHER,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Bitget request failed with HTTP ${response.statusCode}`);
    }

    const body = (await response.body.json()) as BitgetResponse<T>;
    if (body.code !== "00000") {
      throw new Error(`Bitget request failed: ${body.code} ${body.msg}`);
    }
    return body.data;
  } finally {
    clearTimeout(timeout);
  }
}

function numberOrUndefined(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function spreadBps(bid?: number, ask?: number): number | undefined {
  if (!bid || !ask || bid <= 0 || ask <= 0) return undefined;
  const midpoint = (bid + ask) / 2;
  return Math.round(((ask - bid) / midpoint) * 10_000 * 10) / 10;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      "cause" in error && error.cause instanceof Error ? `: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
  }
  return "Unknown Bitget request failure";
}

export async function attachBitgetStockEvidence(companies: Company[]): Promise<Company[]> {
  const fetchedAt = new Date().toISOString();

  try {
    const symbols = await bitgetGet<BitgetSymbolRecord[]>("/api/v2/spot/public/symbols");
    const tickers = await bitgetGet<BitgetTickerRecord[]>("/api/v2/spot/market/tickers").catch(
      () => [],
    );
    const symbolByName = new Map(symbols.map((record) => [record.symbol.toUpperCase(), record]));
    const tickerBySymbol = new Map(tickers.map((record) => [record.symbol.toUpperCase(), record]));

    return companies.map((company) => {
      const symbolName = `${company.ticker.toUpperCase()}ONUSDT`;
      const symbol = symbolByName.get(symbolName);
      const ticker = tickerBySymbol.get(symbolName);
      const bid = numberOrUndefined(ticker?.bidPr);
      const ask = numberOrUndefined(ticker?.askPr);

      const bitget_market: BitgetStockMarketEvidence = symbol
        ? {
            source: "Bitget Public API",
            underlying_ticker: company.ticker,
            symbol: symbol.symbol,
            listed: true,
            status: symbol.status.toLowerCase() === "online" ? "online" : "offline",
            last_price: numberOrUndefined(ticker?.lastPr),
            quote_volume_24h: numberOrUndefined(ticker?.quoteVolume),
            bid_price: bid,
            ask_price: ask,
            spread_bps: spreadBps(bid, ask),
            min_trade_usdt: numberOrUndefined(symbol.minTradeUSDT),
            maker_fee_rate: numberOrUndefined(symbol.makerFeeRate),
            taker_fee_rate: numberOrUndefined(symbol.takerFeeRate),
            market_timestamp: ticker?.ts
              ? new Date(Number(ticker.ts)).toISOString()
              : undefined,
            fetched_at: fetchedAt,
          }
        : {
            source: "Bitget Public API",
            underlying_ticker: company.ticker,
            listed: false,
            status: "not_listed",
            fetched_at: fetchedAt,
          };

      return { ...company, bitget_market };
    });
  } catch (error) {
    return companies.map((company) => ({
      ...company,
      bitget_market: {
        source: "Bitget Public API",
        underlying_ticker: company.ticker,
        listed: false,
        status: "offline",
        fetched_at: fetchedAt,
        error_message: errorMessage(error),
      },
    }));
  }
}

export async function fetchBitgetDailyCandles(
  symbol: string,
  limit = 180,
): Promise<BitgetCandle[]> {
  const rows = await bitgetGet<string[][]>(
    `/api/v2/spot/market/candles?symbol=${encodeURIComponent(symbol)}&granularity=1day&limit=${limit}`,
  );

  return rows
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
}

export const BITGET_STOCK_API_ENDPOINTS = {
  symbols: "/api/v2/spot/public/symbols",
  tickers: "/api/v2/spot/market/tickers",
  candles: "/api/v2/spot/market/candles",
} as const;
