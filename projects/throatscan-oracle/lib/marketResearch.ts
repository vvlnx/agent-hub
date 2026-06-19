import type { Company } from "./types";

const DEFAULT_MARKET_DATA_MCP_URL = "https://datahub.noxiaohao.com/mcp";
const REQUEST_TIMEOUT_MS = 12_000;
const NEWS_FEEDS =
  "cnbc,fed,techcrunch,theverge,wired,arstechnica,bbc_world,guardian,cryptobriefing";

export type ResearchStatus = "verified" | "partial" | "unavailable";
export type MacroVerdict = "RISK_ON" | "MIXED" | "RISK_OFF" | "UNAVAILABLE";

export interface NewsEvidence {
  title: string;
  link?: string;
  published?: string;
  summary: string;
  source: string;
  matched_keyword: string;
}

export interface NewsResearch {
  status: ResearchStatus;
  source: "Bitget Agent Hub market-data MCP";
  skill: "news-briefing";
  query_keywords: string[];
  articles: NewsEvidence[];
  fetched_at: string;
  warnings: string[];
}

export interface MacroDataPoint {
  label: string;
  value?: number;
  date?: string;
  change?: number;
  yoy_change_pct?: number;
}

export interface MacroResearch {
  status: ResearchStatus;
  source: "Bitget Agent Hub market-data MCP";
  skill: "macro-analyst";
  verdict: MacroVerdict;
  verdict_reason_en: string;
  verdict_reason_zh: string;
  rates: Record<string, MacroDataPoint>;
  indicators: Record<string, MacroDataPoint>;
  market_prices: Record<string, MacroDataPoint>;
  yield_curve_inverted?: boolean;
  fetched_at: string;
  warnings: string[];
}

export interface MarketResearch {
  enabled: boolean;
  mcp_url: string;
  tools_used: string[];
  news: NewsResearch;
  macro: MacroResearch;
}

interface McpSession {
  url: string;
  sessionId: string;
  nextId: number;
}

function marketDataMcpUrl(): string {
  return process.env.MARKET_DATA_MCP_URL?.trim() || DEFAULT_MARKET_DATA_MCP_URL;
}

function marketResearchEnabled(): boolean {
  return process.env.THROATSCAN_MARKET_RESEARCH?.trim() !== "0";
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseSseJson(text: string): Record<string, unknown> {
  const dataLine = text
    .split(/\r?\n/)
    .find((line) => line.startsWith("data: "));
  if (!dataLine) {
    throw new Error("market-data MCP returned an unreadable response");
  }
  const parsed = JSON.parse(dataLine.slice(6)) as unknown;
  const parsedRecord = record(parsed);
  if (!parsedRecord) {
    throw new Error("market-data MCP returned invalid JSON");
  }
  return parsedRecord;
}

async function mcpPost(
  url: string,
  payload: Record<string, unknown>,
  sessionId?: string,
): Promise<{ body: string; sessionId?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`market-data MCP HTTP ${response.status}`);
    }
    return {
      body: await response.text(),
      sessionId: response.headers.get("mcp-session-id") ?? undefined,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function createMcpSession(): Promise<McpSession> {
  const url = marketDataMcpUrl();
  const initialized = await mcpPost(url, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "throatscan-oracle", version: "1.0.0" },
    },
  });
  parseSseJson(initialized.body);
  if (!initialized.sessionId) {
    throw new Error("market-data MCP did not create a session");
  }
  await mcpPost(
    url,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    initialized.sessionId,
  );
  return { url, sessionId: initialized.sessionId, nextId: 2 };
}

async function callMcpTool(
  session: McpSession,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const response = await mcpPost(
    session.url,
    {
      jsonrpc: "2.0",
      id: session.nextId++,
      method: "tools/call",
      params: { name, arguments: args },
    },
    session.sessionId,
  );
  const envelope = parseSseJson(response.body);
  const error = record(envelope.error);
  if (error) {
    throw new Error(asString(error.message) || `${name} failed`);
  }
  const result = record(envelope.result);
  const content = Array.isArray(result?.content) ? result.content : [];
  const textItem = content.map(record).find((item) => item?.type === "text");
  const text = asString(textItem?.text);
  if (!text) {
    throw new Error(`${name} returned no data`);
  }
  return JSON.parse(text) as unknown;
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

function parseNews(payload: unknown, keyword: string): NewsEvidence[] {
  if (!Array.isArray(payload)) return [];
  const articles: NewsEvidence[] = [];

  for (const feedValue of payload) {
    const feed = record(feedValue);
    const source = asString(feed?.feed) || "news";
    const items = Array.isArray(feed?.items) ? feed.items : [];
    for (const itemValue of items) {
      const item = record(itemValue);
      const title = asString(item?.title);
      if (!title) continue;
      articles.push({
        title: stripMarkup(title),
        link: asString(item?.link),
        published: asString(item?.published),
        summary: stripMarkup(asString(item?.summary) || ""),
        source,
        matched_keyword: keyword,
      });
    }
  }

  return articles
    .filter(
      (article, index, rows) =>
        rows.findIndex((candidate) => candidate.title === article.title) === index,
    )
    .slice(0, 6);
}

function parseDataPoints(payload: unknown): Record<string, MacroDataPoint> {
  const payloadRecord = record(payload);
  if (!payloadRecord) return {};
  const output: Record<string, MacroDataPoint> = {};

  for (const [key, value] of Object.entries(payloadRecord)) {
    const item = record(value);
    if (!item) continue;
    output[key] = {
      label: asString(item.label) || key,
      value: asNumber(item.value ?? item.latest_value ?? item.price),
      date: asString(item.date ?? item.latest_date),
      change: asNumber(item.change),
      yoy_change_pct: asNumber(item.yoy_change_pct),
    };
  }
  return output;
}

function pricePoint(payload: unknown, label: string): MacroDataPoint | null {
  const item = record(payload);
  const value = asNumber(item?.price);
  if (value === undefined) return null;
  return { label, value };
}

function buildMacroVerdict(
  rates: Record<string, MacroDataPoint>,
  indicators: Record<string, MacroDataPoint>,
  marketPrices: Record<string, MacroDataPoint>,
  yieldCurveInverted?: boolean,
): Pick<MacroResearch, "verdict" | "verdict_reason_en" | "verdict_reason_zh"> {
  let score = 0;
  const vix = marketPrices.vix?.value;
  const t10yChange = rates.t10y?.change;
  const breakeven = rates.breakeven_10y?.value;
  const cpiYoy = indicators.cpi?.yoy_change_pct;
  const corePceYoy = indicators.core_pce?.yoy_change_pct;

  if (vix !== undefined) score += vix >= 25 ? -2 : vix < 20 ? 1 : 0;
  if (t10yChange !== undefined) score += t10yChange >= 0.05 ? -1 : t10yChange <= -0.05 ? 1 : 0;
  if (breakeven !== undefined) score += breakeven > 2.5 ? -1 : breakeven <= 2.3 ? 1 : 0;
  if (cpiYoy !== undefined) score += cpiYoy > 3 ? -1 : cpiYoy < 2.5 ? 1 : 0;
  if (corePceYoy !== undefined) score += corePceYoy > 3 ? -1 : corePceYoy < 2.5 ? 1 : 0;
  if (yieldCurveInverted) score -= 1;

  const verdict: MacroVerdict = score >= 2 ? "RISK_ON" : score <= -2 ? "RISK_OFF" : "MIXED";
  const verdictZh =
    verdict === "RISK_ON" ? "风险偏好" : verdict === "RISK_OFF" ? "风险规避" : "中性混合";
  const rateText =
    rates.t10y?.value !== undefined ? `10Y Treasury ${rates.t10y.value}%` : "10Y yield unavailable";
  const vixText = vix !== undefined ? `VIX ${vix.toFixed(2)}` : "VIX unavailable";
  const inflationText =
    corePceYoy !== undefined ? `Core PCE YoY ${corePceYoy.toFixed(2)}%` : "Core PCE unavailable";
  const rateTextZh =
    rates.t10y?.value !== undefined ? `美国 10 年期国债收益率 ${rates.t10y.value}%` : "美国 10 年期国债收益率暂不可用";
  const vixTextZh = vix !== undefined ? `VIX 波动率 ${vix.toFixed(2)}` : "VIX 波动率暂不可用";
  const inflationTextZh =
    corePceYoy !== undefined ? `核心 PCE 同比 ${corePceYoy.toFixed(2)}%` : "核心 PCE 暂不可用";

  return {
    verdict,
    verdict_reason_en: `${rateText}, ${vixText}, and ${inflationText} produce a ${verdict.replace("_", "-")} macro regime for risk assets.`,
    verdict_reason_zh: `${rateTextZh}、${vixTextZh}、${inflationTextZh}，综合判断风险资产宏观环境为${verdictZh}。`,
  };
}

function unavailableResearch(reason: string): MarketResearch {
  const fetchedAt = new Date().toISOString();
  return {
    enabled: marketResearchEnabled(),
    mcp_url: marketDataMcpUrl(),
    tools_used: [],
    news: {
      status: "unavailable",
      source: "Bitget Agent Hub market-data MCP",
      skill: "news-briefing",
      query_keywords: [],
      articles: [],
      fetched_at: fetchedAt,
      warnings: [reason],
    },
    macro: {
      status: "unavailable",
      source: "Bitget Agent Hub market-data MCP",
      skill: "macro-analyst",
      verdict: "UNAVAILABLE",
      verdict_reason_en: reason,
      verdict_reason_zh: "宏观数据暂时不可用。",
      rates: {},
      indicators: {},
      market_prices: {},
      fetched_at: fetchedAt,
      warnings: [reason],
    },
  };
}

export async function fetchMarketResearch(input: {
  industry: string;
  companies: Company[];
}): Promise<MarketResearch> {
  if (!marketResearchEnabled()) {
    return unavailableResearch("Market research is disabled by configuration.");
  }

  const fetchedAt = new Date().toISOString();
  try {
    const session = await createMcpSession();
    const newsKeywords = [
      input.industry,
      ...input.companies.slice(0, 2).map((company) => company.name || company.ticker),
    ].filter((value, index, rows) => value && rows.indexOf(value) === index);
    const newsCallCount = newsKeywords.length;
    const toolsUsed = [
      "news_feed",
      "rates_yields",
      "macro_indicators",
      "global_assets:^VIX",
      "global_assets:^NDX",
      "global_assets:DX-Y.NYB",
    ];
    const calls = await Promise.allSettled([
      ...newsKeywords.map((keyword) =>
        callMcpTool(session, "news_feed", {
          action: "latest",
          feeds: NEWS_FEEDS,
          keyword,
          limit: 3,
        }),
      ),
      callMcpTool(session, "rates_yields", { action: "rates_snapshot" }),
      callMcpTool(session, "macro_indicators", {
        action: "multi_indicator",
        indicators: "cpi,core_pce,nonfarm_payrolls,gdp_growth,unemployment",
      }),
      callMcpTool(session, "global_assets", { action: "price", symbol: "^VIX" }),
      callMcpTool(session, "global_assets", { action: "price", symbol: "^NDX" }),
      callMcpTool(session, "global_assets", { action: "price", symbol: "DX-Y.NYB" }),
    ]);

    const warningFor = (index: number, label: string): string | null => {
      const result = calls[index];
      return result.status === "rejected" ? `${label}: ${result.reason}` : null;
    };
    const warnings = [
      ...newsKeywords.map((keyword, index) => warningFor(index, `news_feed:${keyword}`)),
      warningFor(newsCallCount, "rates_yields"),
      warningFor(newsCallCount + 1, "macro_indicators"),
      warningFor(newsCallCount + 2, "VIX"),
      warningFor(newsCallCount + 3, "Nasdaq 100"),
      warningFor(newsCallCount + 4, "DXY"),
    ].filter((value): value is string => value !== null);
    const newsWarnings = warnings.filter((warning) => warning.startsWith("news_feed"));

    const valueAt = (index: number): unknown =>
      calls[index]?.status === "fulfilled" ? calls[index].value : null;
    const articles = newsKeywords
      .flatMap((keyword, index) => parseNews(valueAt(index), keyword))
      .filter(
        (article, index, rows) =>
          rows.findIndex((candidate) => candidate.title === article.title) === index,
      )
      .slice(0, 12);
    const ratesPayload = record(valueAt(newsCallCount));
    const rates = parseDataPoints(ratesPayload);
    const indicators = parseDataPoints(valueAt(newsCallCount + 1));
    const marketPrices: Record<string, MacroDataPoint> = {};
    const vix = pricePoint(valueAt(newsCallCount + 2), "VIX");
    const nasdaq = pricePoint(valueAt(newsCallCount + 3), "Nasdaq 100");
    const dxy = pricePoint(valueAt(newsCallCount + 4), "US Dollar Index");
    if (vix) marketPrices.vix = vix;
    if (nasdaq) marketPrices.nasdaq_100 = nasdaq;
    if (dxy) marketPrices.dxy = dxy;

    const yieldCurveInverted =
      typeof ratesPayload?.yield_curve_inverted === "boolean"
        ? ratesPayload.yield_curve_inverted
        : undefined;
    const verdict = buildMacroVerdict(rates, indicators, marketPrices, yieldCurveInverted);
    const macroDataCount =
      Object.keys(rates).length + Object.keys(indicators).length + Object.keys(marketPrices).length;

    return {
      enabled: true,
      mcp_url: session.url,
      tools_used: toolsUsed,
      news: {
        status:
          articles.length > 0
            ? newsWarnings.length > 0
              ? "partial"
              : "verified"
            : newsWarnings.length === newsCallCount
              ? "unavailable"
              : "partial",
        source: "Bitget Agent Hub market-data MCP",
        skill: "news-briefing",
        query_keywords: newsKeywords,
        articles,
        fetched_at: fetchedAt,
        warnings:
          articles.length > 0
            ? newsWarnings
            : ["No matching articles were returned for the industry or top candidates."],
      },
      macro: {
        status: macroDataCount >= 8 ? "verified" : macroDataCount > 0 ? "partial" : "unavailable",
        source: "Bitget Agent Hub market-data MCP",
        skill: "macro-analyst",
        ...verdict,
        rates,
        indicators,
        market_prices: marketPrices,
        yield_curve_inverted: yieldCurveInverted,
        fetched_at: fetchedAt,
        warnings: warnings.filter((warning) => !warning.startsWith("news_feed")),
      },
    };
  } catch (error) {
    return unavailableResearch(
      error instanceof Error ? error.message : "Market research request failed.",
    );
  }
}
