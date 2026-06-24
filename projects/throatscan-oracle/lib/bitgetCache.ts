import { request, EnvHttpProxyAgent, ProxyAgent } from "undici";

const BITGET_API_BASE_URL = "https://api.bitget.com";
const CACHE_TTL_MS = 5 * 60 * 1000;

const configuredProxy =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy;
const DISPATCHER = configuredProxy ? new ProxyAgent(configuredProxy) : new EnvHttpProxyAgent();

interface CacheEntry<T> {
  expires_at: number;
  data: T;
}

let symbolsCache: CacheEntry<unknown> | null = null;
let tickersCache: CacheEntry<unknown> | null = null;

async function bitgetPublicGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await request(`${BITGET_API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      dispatcher: DISPATCHER,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Bitget HTTP ${response.statusCode}`);
    }
    const body = (await response.body.json()) as { code: string; msg: string; data: T };
    if (body.code !== "00000") {
      throw new Error(`Bitget ${body.code} ${body.msg}`);
    }
    return body.data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCachedBitgetSymbols<T>(): Promise<T> {
  const now = Date.now();
  if (symbolsCache && symbolsCache.expires_at > now) {
    return symbolsCache.data as T;
  }
  const data = await bitgetPublicGet<T>("/api/v3/market/instruments?category=SPOT");
  symbolsCache = { data, expires_at: now + CACHE_TTL_MS };
  return data;
}

export async function getCachedBitgetTickers<T>(): Promise<T> {
  const now = Date.now();
  if (tickersCache && tickersCache.expires_at > now) {
    return tickersCache.data as T;
  }
  const data = await bitgetPublicGet<T>("/api/v3/market/tickers?category=SPOT");
  tickersCache = { data, expires_at: now + CACHE_TTL_MS };
  return data;
}

export async function warmBitgetPublicCache(): Promise<{ symbols: boolean; tickers: boolean }> {
  const results = await Promise.allSettled([
    getCachedBitgetSymbols<unknown[]>(),
    getCachedBitgetTickers<unknown[]>(),
  ]);
  return {
    symbols: results[0].status === "fulfilled",
    tickers: results[1].status === "fulfilled",
  };
}

export function clearBitgetPublicCache(): void {
  symbolsCache = null;
  tickersCache = null;
}
