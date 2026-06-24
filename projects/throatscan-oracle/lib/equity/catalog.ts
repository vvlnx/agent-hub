import appUniverseSeed from "../../data/bitget-us-stocks-app-universe.json";
import { getCachedBitgetSymbols, getCachedBitgetTickers } from "../bitgetCache";
import {
  isEquityExecutable,
  rankInstruments,
} from "./policy";
import type {
  BitgetCatalogSnapshot,
  BitgetEquityInstrument,
  ExecutionTier,
} from "./types";

interface SpotSymbolRow {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
  minTradeUSDT?: string;
  makerFeeRate?: string;
  takerFeeRate?: string;
}

interface SpotTickerRow {
  symbol: string;
  lastPr: string;
  quoteVolume: string;
  bidPr: string;
  askPr: string;
  ts: string;
}

interface AppUniverseSeed {
  as_of: string;
  tickers: string[];
}

let catalogCache: {
  expires_at: number;
  by_ticker: Map<string, BitgetEquityInstrument[]>;
  snapshot: BitgetCatalogSnapshot;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000;

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

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function ondoSymbolForTicker(ticker: string): string {
  return `${normalizeTicker(ticker)}ONUSDT`;
}

function parseOndoSpotInstrument(
  ticker: string,
  symbol: SpotSymbolRow,
  tickerRow?: SpotTickerRow,
  fetchedAt?: string,
): BitgetEquityInstrument {
  const bid = numberOrUndefined(tickerRow?.bidPr);
  const ask = numberOrUndefined(tickerRow?.askPr);
  const online = symbol.status?.toLowerCase() === "online";

  return {
    underlying_ticker: normalizeTicker(ticker),
    product_line: "ondo_spot",
    symbol: symbol.symbol,
    quote_currency: "USDT",
    settlement_currency: "USDT",
    listed: true,
    status: online ? "online" : "offline",
    tradability: online ? "executable_now" : "executable_session",
    last_price: numberOrUndefined(tickerRow?.lastPr),
    quote_volume_24h: numberOrUndefined(tickerRow?.quoteVolume),
    bid_price: bid,
    ask_price: ask,
    spread_bps: spreadBps(bid, ask),
    min_notional: numberOrUndefined(symbol.minTradeUSDT),
    maker_fee_rate: numberOrUndefined(symbol.makerFeeRate),
    taker_fee_rate: numberOrUndefined(symbol.takerFeeRate),
    market_timestamp: tickerRow?.ts
      ? Number.isNaN(Number(tickerRow.ts))
        ? undefined
        : new Date(Number(tickerRow.ts)).toISOString()
      : fetchedAt,
  };
}

function parseRTokenInstrument(
  ticker: string,
  symbol: SpotSymbolRow,
  tickerRow?: SpotTickerRow,
  fetchedAt?: string,
): BitgetEquityInstrument {
  const base = parseOndoSpotInstrument(ticker, symbol, tickerRow, fetchedAt);
  return {
    ...base,
    product_line: "rtoken_spot",
    quote_currency: "USDT",
    settlement_currency: "USDT",
  };
}

function appDirectInstrument(ticker: string, catalogAsOf: string): BitgetEquityInstrument {
  return {
    underlying_ticker: normalizeTicker(ticker),
    product_line: "us_stocks_direct",
    symbol: normalizeTicker(ticker),
    quote_currency: "USDC",
    settlement_currency: "USD",
    listed: true,
    status: "online",
    tradability: "listed_no_api",
    market_timestamp: catalogAsOf,
  };
}

function extractTickerFromSpotSymbol(symbol: SpotSymbolRow): string | null {
  const upper = symbol.symbol.toUpperCase();
  if (upper.endsWith("ONUSDT")) {
    return upper.slice(0, -"ONUSDT".length);
  }
  if (upper.startsWith("R") && upper.endsWith("USDT") && upper.length > 5) {
    return upper.slice(1, -"USDT".length);
  }
  return null;
}

function buildSnapshot(
  byTicker: Map<string, BitgetEquityInstrument[]>,
  appCatalogAsOf: string,
): BitgetCatalogSnapshot {
  let ondo = 0;
  let rtoken = 0;
  let app = 0;

  for (const instruments of byTicker.values()) {
    for (const instrument of instruments) {
      if (instrument.product_line === "ondo_spot" && instrument.status === "online") ondo += 1;
      if (instrument.product_line === "rtoken_spot" && instrument.status === "online") rtoken += 1;
      if (instrument.product_line === "us_stocks_direct") app += 1;
    }
  }

  return {
    fetched_at: new Date().toISOString(),
    app_catalog_as_of: appCatalogAsOf,
    counts: {
      ondo_spot_online: ondo,
      rtoken_online: rtoken,
      us_stocks_app: app,
      total_unique_tickers: byTicker.size,
    },
  };
}

export async function loadEquityCatalog(force = false): Promise<{
  by_ticker: Map<string, BitgetEquityInstrument[]>;
  snapshot: BitgetCatalogSnapshot;
}> {
  const now = Date.now();
  if (!force && catalogCache && catalogCache.expires_at > now) {
    return {
      by_ticker: catalogCache.by_ticker,
      snapshot: catalogCache.snapshot,
    };
  }

  const seed = appUniverseSeed as AppUniverseSeed;
  const fetchedAt = new Date().toISOString();
  const byTicker = new Map<string, BitgetEquityInstrument[]>();

  const pushInstrument = (instrument: BitgetEquityInstrument): void => {
    const key = instrument.underlying_ticker;
    const existing = byTicker.get(key) ?? [];
    if (existing.some((row) => row.product_line === instrument.product_line && row.symbol === instrument.symbol)) {
      return;
    }
    byTicker.set(key, [...existing, instrument]);
  };

  try {
    const [symbols, tickers] = await Promise.all([
      getCachedBitgetSymbols<SpotSymbolRow[]>(),
      getCachedBitgetTickers<SpotTickerRow[]>().catch(() => [] as SpotTickerRow[]),
    ]);
    const tickerBySymbol = new Map(tickers.map((row) => [row.symbol.toUpperCase(), row]));

    for (const symbol of symbols) {
      const ticker = extractTickerFromSpotSymbol(symbol);
      if (!ticker) continue;
      const tickerRow = tickerBySymbol.get(symbol.symbol.toUpperCase());
      if (symbol.symbol.toUpperCase().startsWith("R") && symbol.symbol.toUpperCase().endsWith("USDT")) {
        pushInstrument(parseRTokenInstrument(ticker, symbol, tickerRow, fetchedAt));
      } else if (symbol.symbol.toUpperCase().endsWith("ONUSDT")) {
        pushInstrument(parseOndoSpotInstrument(ticker, symbol, tickerRow, fetchedAt));
      }
    }
  } catch {
    // Spot API unavailable — app catalog still loads below.
  }

  for (const ticker of seed.tickers) {
    pushInstrument(appDirectInstrument(ticker, seed.as_of));
  }

  for (const [ticker, instruments] of byTicker.entries()) {
    byTicker.set(ticker, rankInstruments(instruments));
  }

  const snapshot = buildSnapshot(byTicker, seed.as_of);
  catalogCache = {
    expires_at: now + CACHE_TTL_MS,
    by_ticker: byTicker,
    snapshot,
  };

  return { by_ticker: byTicker, snapshot };
}

export function clearEquityCatalogCache(): void {
  catalogCache = null;
}

export function executionTierForTicker(
  ticker: string,
  instruments: BitgetEquityInstrument[],
): ExecutionTier {
  const ranked = rankInstruments(instruments);
  const executable = ranked.find((instrument) => isEquityExecutable(instrument));
  if (executable) return "A";
  const appOnly = ranked.find((instrument) => instrument.product_line === "us_stocks_direct");
  if (appOnly) return "B";
  if (ranked.length > 0) return "C";
  return "C";
}

export function getAppCatalogTickers(): string[] {
  const seed = appUniverseSeed as AppUniverseSeed;
  return seed.tickers.map(normalizeTicker);
}

export { ondoSymbolForTicker, normalizeTicker };
