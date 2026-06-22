import { getCachedBitgetTickers } from "../bitgetCache";
import { ondoSymbolForTicker } from "../equity";
import { bitgetPrivateRequest, loadBitgetDemoCredentials } from "../bitgetPrivate";
import type {
  PaperBasketRequest,
  PaperBasketResult,
  PaperOrder,
  PaperTradingStatus,
} from "./types";

interface TickerRow {
  symbol: string;
  lastPr: string;
}

const LOCAL_ORDERS: PaperOrder[] = [];
const MAX_LOCAL_ORDERS = 200;
const DEFAULT_QUOTE_SIZE = 25;

function trimLocalOrders(): void {
  if (LOCAL_ORDERS.length > MAX_LOCAL_ORDERS) {
    LOCAL_ORDERS.splice(0, LOCAL_ORDERS.length - MAX_LOCAL_ORDERS);
  }
}

function tickerToSpotSymbol(ticker: string): string {
  return ondoSymbolForTicker(ticker);
}

async function publicMarketLive(): Promise<boolean> {
  try {
    const tickers = await getCachedBitgetTickers<TickerRow[]>();
    return tickers.some((row) => row.symbol.endsWith("ONUSDT") || row.symbol.startsWith("r"));
  } catch {
    return false;
  }
}

async function fetchDemoBalanceUsdt(): Promise<number | undefined> {
  const credentials = loadBitgetDemoCredentials();
  if (!credentials) return undefined;

  try {
    const assets = await bitgetPrivateRequest<
      Array<{ coin: string; available: string; frozen: string }>
    >({
      credentials,
      method: "GET",
      path: "/api/v2/spot/account/assets",
    });
    const usdt = assets.find((row) => row.coin.toUpperCase() === "USDT");
    return usdt ? Number(usdt.available) : undefined;
  } catch {
    return undefined;
  }
}

export async function getPaperTradingStatus(): Promise<PaperTradingStatus> {
  const demoConfigured = Boolean(loadBitgetDemoCredentials());
  const publicLive = await publicMarketLive();
  const balance = demoConfigured ? await fetchDemoBalanceUsdt() : undefined;
  const mode = demoConfigured ? "bitget_demo" : publicLive ? "local_paper" : "disconnected";
  const runnability_level = demoConfigured
    ? "bitget_demo"
    : publicLive
      ? "local_paper"
      : "backtest_only";

  return {
    mode,
    runnability_level,
    demo_configured: demoConfigured,
    public_market_live: publicLive,
    balance_usdt: balance,
    recent_orders_count: LOCAL_ORDERS.length,
    last_checked_at: new Date().toISOString(),
    message_en: demoConfigured
      ? "Bitget Demo Trading API is configured. Paper orders can route to the demo account with paptrading=1."
      : publicLive
        ? "Local paper portfolio is active using live Bitget public prices. Configure BITGET_DEMO_* env vars to upgrade to Bitget demo trading."
        : "Public Bitget market data is unavailable. Only backtest evidence can be generated.",
    message_zh: demoConfigured
      ? "已配置 Bitget Demo Trading API，纸交易订单可通过 paptrading=1 路由到 demo 账户。"
      : publicLive
        ? "本地纸交易组合已启用，使用 Bitget 公开价格。配置 BITGET_DEMO_* 环境变量可升级到 Bitget demo 交易。"
        : "Bitget 公开行情不可用，仅可生成回测证据。",
  };
}

async function placeDemoMarketBuy(
  symbol: string,
  quoteSizeUsdt: number,
): Promise<{ orderId?: string; error?: string }> {
  const credentials = loadBitgetDemoCredentials();
  if (!credentials) {
    return { error: "Demo credentials not configured" };
  }

  try {
    const data = await bitgetPrivateRequest<{ orderId?: string; clientOid?: string }>({
      credentials,
      method: "POST",
      path: "/api/v2/spot/trade/place-order",
      body: {
        symbol,
        side: "buy",
        orderType: "market",
        force: "ioc",
        size: String(quoteSizeUsdt),
      },
    });
    return { orderId: data.orderId ?? data.clientOid };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Demo order failed" };
  }
}

export async function submitPaperBasket(
  input: PaperBasketRequest,
): Promise<PaperBasketResult> {
  const status = await getPaperTradingStatus();
  const quoteSize = input.quote_size_usdt ?? DEFAULT_QUOTE_SIZE;
  const tickers = [...new Set(input.tickers.map((t) => t.toUpperCase()))].slice(0, 5);

  if (tickers.length === 0) {
    return {
      mode: status.mode,
      runnability_level: status.runnability_level,
      orders: [],
      summary_en: "No Bitget-tradable tickers were provided for paper execution.",
      summary_zh: "没有可提交纸交易的 Bitget 标的。",
    };
  }

  let tickersData: TickerRow[] = [];
  try {
    tickersData = await getCachedBitgetTickers<TickerRow[]>();
  } catch {
    tickersData = [];
  }
  const priceBySymbol = new Map(
    tickersData.map((row) => [row.symbol.toUpperCase(), Number(row.lastPr)]),
  );

  const orders: PaperOrder[] = [];

  for (const ticker of tickers) {
    const symbol = tickerToSpotSymbol(ticker);
    const referencePrice = priceBySymbol.get(symbol);
    const baseOrder: PaperOrder = {
      order_id: `${input.run_id}-${symbol}-${Date.now()}`,
      run_id: input.run_id,
      symbol,
      underlying_ticker: ticker,
      side: "buy",
      order_type: "market",
      quote_size_usdt: quoteSize,
      reference_price: Number.isFinite(referencePrice) ? referencePrice : undefined,
      status: "filled_local",
      venue: "local_paper",
      reason: input.rationale,
      created_at: new Date().toISOString(),
    };

    if (status.demo_configured) {
      const demo = await placeDemoMarketBuy(symbol, quoteSize);
      if (demo.orderId) {
        orders.push({
          ...baseOrder,
          status: "submitted_demo",
          venue: "bitget_demo",
          bitget_order_id: demo.orderId,
        });
      } else {
        orders.push({
          ...baseOrder,
          status: demo.error ? "failed" : "filled_local",
          error_message: demo.error,
        });
      }
    } else {
      orders.push(baseOrder);
    }

    LOCAL_ORDERS.push(orders[orders.length - 1]!);
  }

  trimLocalOrders();

  const demoCount = orders.filter((order) => order.venue === "bitget_demo").length;
  const localCount = orders.filter((order) => order.venue === "local_paper" && order.status === "filled_local").length;

  return {
    mode: status.mode,
    runnability_level: status.runnability_level,
    orders,
    summary_en:
      demoCount > 0
        ? `Submitted ${demoCount} Bitget demo market order(s) and recorded ${localCount} local paper fill(s) for run ${input.run_id}.`
        : `Recorded ${localCount} local paper market fill(s) at live Bitget reference prices for run ${input.run_id}.`,
    summary_zh:
      demoCount > 0
        ? `已为运行 ${input.run_id} 提交 ${demoCount} 笔 Bitget demo 市价单，并记录 ${localCount} 笔本地纸交易成交。`
        : `已按 Bitget 实时参考价记录 ${localCount} 笔本地纸交易成交（运行 ${input.run_id}）。`,
  };
}

export function listRecentPaperOrders(limit = 20): PaperOrder[] {
  return LOCAL_ORDERS.slice(-limit).reverse();
}
