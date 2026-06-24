import appUniverseSeed from "../../data/bitget-us-stocks-app-universe.json";
import { getCachedBitgetSymbols, getCachedBitgetTickers } from "../bitgetCache";
import { getCatalogEntry } from "../gics/staticCatalog";
import {
  isEquityExecutable,
  rankInstruments,
} from "./policy";
import type {
  BitgetCatalogSnapshot,
  BitgetEquityInstrument,
  ExecutionTier,
} from "./types";

interface V3InstrumentRow {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  symbolType: string;
  status: string;
  minOrderAmount?: string;
}

interface V3TickerRow {
  symbol: string;
  lastPrice: string;
  turnover24h: string;
  bid1Price: string;
  ask1Price: string;
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
  gics_listed_peers_by_prefix: Map<string, GicsListedPeer[]>;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000;
const GICS_PREFIX_LENGTHS = [2, 4, 6, 8] as const;

export interface GicsListedPeer {
  ticker: string;
  gics_code: string;
  company_name?: string;
  execution_tier: ExecutionTier;
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

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function ondoSymbolForTicker(ticker: string): string {
  return `${normalizeTicker(ticker)}ONUSDT`;
}

function productLineForInstrument(symbol: string): BitgetEquityInstrument["product_line"] {
  return symbol.toUpperCase().endsWith("ONUSDT") ? "ondo_spot" : "rtoken_spot";
}

function parseStockInstrument(
  ticker: string,
  instrument: V3InstrumentRow,
  tickerRow?: V3TickerRow,
  fetchedAt?: string,
): BitgetEquityInstrument {
  const bid = numberOrUndefined(tickerRow?.bid1Price);
  const ask = numberOrUndefined(tickerRow?.ask1Price);
  const online = instrument.status?.toLowerCase() === "online";

  return {
    underlying_ticker: normalizeTicker(ticker),
    product_line: productLineForInstrument(instrument.symbol),
    symbol: instrument.symbol,
    quote_currency: "USDT",
    settlement_currency: "USDT",
    listed: true,
    status: online ? "online" : "offline",
    tradability: online ? "executable_now" : "executable_session",
    last_price: numberOrUndefined(tickerRow?.lastPrice),
    quote_volume_24h: numberOrUndefined(tickerRow?.turnover24h),
    bid_price: bid,
    ask_price: ask,
    spread_bps: spreadBps(bid, ask),
    min_notional: numberOrUndefined(instrument.minOrderAmount),
    market_timestamp: tickerRow?.ts
      ? Number.isNaN(Number(tickerRow.ts))
        ? undefined
        : new Date(Number(tickerRow.ts)).toISOString()
      : fetchedAt,
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

function extractTickerFromStockInstrument(instrument: V3InstrumentRow): string | null {
  const base = instrument.baseCoin;
  if (base.startsWith("r") && base.length > 1) {
    return base.slice(1).toUpperCase();
  }
  const upper = instrument.symbol.toUpperCase();
  if (upper.endsWith("ONUSDT")) {
    return upper.slice(0, -"ONUSDT".length);
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

function hasBitgetListing(instruments: BitgetEquityInstrument[]): boolean {
  return instruments.some(
    (instrument) =>
      instrument.product_line === "us_stocks_direct" ||
      (instrument.status === "online" && instrument.listed),
  );
}

function buildGicsListedPeerIndex(
  byTicker: Map<string, BitgetEquityInstrument[]>,
): Map<string, GicsListedPeer[]> {
  const index = new Map<string, Map<string, GicsListedPeer>>();

  for (const [ticker, instruments] of byTicker.entries()) {
    if (!hasBitgetListing(instruments)) continue;

    const execution_tier = executionTierForTicker(ticker, instruments);
    if (execution_tier === "C") continue;

    const catalog = getCatalogEntry(ticker);
    const gics_code = catalog?.gics_code;
    if (!gics_code || gics_code === "00000000") continue;

    const peer: GicsListedPeer = {
      ticker,
      gics_code,
      company_name: catalog.company_name,
      execution_tier,
    };

    for (const length of GICS_PREFIX_LENGTHS) {
      const prefix = gics_code.slice(0, length);
      if (prefix.length < length) continue;
      const bucket = index.get(prefix) ?? new Map<string, GicsListedPeer>();
      bucket.set(ticker, peer);
      index.set(prefix, bucket);
    }
  }

  const sorted = new Map<string, GicsListedPeer[]>();
  for (const [prefix, peers] of index.entries()) {
    sorted.set(
      prefix,
      [...peers.values()].sort((a, b) => {
        const tierOrder = { A: 0, B: 1, C: 2 } as const;
        const tierDiff = tierOrder[a.execution_tier] - tierOrder[b.execution_tier];
        if (tierDiff !== 0) return tierDiff;
        return a.ticker.localeCompare(b.ticker);
      }),
    );
  }

  return sorted;
}

export function getListedPeersForGicsPrefix(prefix: string, limit = 400): GicsListedPeer[] {
  const normalized = prefix.replace(/\D/g, "").slice(0, 8);
  if (!normalized || !catalogCache) return [];

  for (const length of [...GICS_PREFIX_LENGTHS].reverse()) {
    const key = normalized.slice(0, length);
    if (key.length < length) continue;
    const peers = catalogCache.gics_listed_peers_by_prefix.get(key);
    if (peers?.length) {
      return peers.slice(0, limit);
    }
  }

  return [];
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
    const [instruments, tickers] = await Promise.all([
      getCachedBitgetSymbols<V3InstrumentRow[]>(),
      getCachedBitgetTickers<V3TickerRow[]>().catch(() => [] as V3TickerRow[]),
    ]);
    const tickerBySymbol = new Map(tickers.map((row) => [row.symbol.toUpperCase(), row]));

    for (const instrument of instruments) {
      if (instrument.symbolType?.toLowerCase() !== "stock") continue;
      const ticker = extractTickerFromStockInstrument(instrument);
      if (!ticker) continue;
      const tickerRow = tickerBySymbol.get(instrument.symbol.toUpperCase());
      pushInstrument(parseStockInstrument(ticker, instrument, tickerRow, fetchedAt));
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
  const gics_listed_peers_by_prefix = buildGicsListedPeerIndex(byTicker);
  catalogCache = {
    expires_at: now + CACHE_TTL_MS,
    by_ticker: byTicker,
    snapshot,
    gics_listed_peers_by_prefix,
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
