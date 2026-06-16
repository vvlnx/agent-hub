import type { BacktestValidation } from "./backtest";
import {
  attachBitgetStockEvidence,
  fetchBitgetDailyCandles,
  type BitgetCandle,
} from "./bitgetStocks";
import { COMPANY_UNIVERSE } from "./companyUniverse";
import type { CompanySeed, IndustryProfile } from "./mockData";
import type { Company, ThroatRole } from "./types";
import { normalizeBreakdown, normalizeCompany } from "./types";

export type IndustryMapStage = "upstream" | "midstream" | "downstream";

export type StockTrendDirection = "UP" | "DOWN" | "FLAT" | "UNKNOWN";

export interface CompanyStockTrend {
  status: "verified" | "unavailable";
  source: "Bitget Public API";
  trend: StockTrendDirection;
  period?: string;
  observations?: number;
  total_return_pct?: number;
  latest_close?: number;
  reason: string;
}

export interface IndustryMapCompany {
  ticker: string;
  name: string;
  stage: IndustryMapStage;
  chain_position: string;
  throat_role: ThroatRole;
  score: number;
  supply_role_label?: string;
  bitget_symbol?: string;
  bitget_status: "online" | "offline" | "not_listed";
  last_price?: number;
  quote_volume_24h?: number;
  stock_trend: CompanyStockTrend;
}

export interface IndustryMapLayer {
  stage: IndustryMapStage;
  title: string;
  purpose: string;
  companies: IndustryMapCompany[];
  bottleneck_count: number;
  bitget_online_count: number;
}

export interface IndustryMap {
  source: "ThroatScan structured industry map";
  thesis: string;
  scope_note: string;
  stock_trend_note: string;
  layers: IndustryMapLayer[];
  generated_at: string;
}

const STAGE_ORDER: IndustryMapStage[] = ["upstream", "midstream", "downstream"];
const GENERIC_TOKENS = new Set([
  "and",
  "the",
  "for",
  "with",
  "industry",
  "market",
  "markets",
  "stock",
  "stocks",
  "value",
  "chain",
  "supply",
  "demand",
]);

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .split(/\s+/)
    .map((token) => (token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token))
    .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token));
}

function expandedIndustryTokens(profile: IndustryProfile): Set<string> {
  const tokens = new Set(
    tokenize(
      [
        profile.label,
        profile.interpretation.user_input,
        profile.interpretation.display_label,
        ...profile.interpretation.sector_tags,
      ].join(" "),
    ),
  );

  if (tokens.has("chip") || tokens.has("semiconductor")) {
    [
      "semiconductor",
      "wafer",
      "fab",
      "foundry",
      "lithography",
      "euv",
      "gpu",
      "cpu",
      "accelerator",
      "asic",
      "networking",
      "server",
      "rack",
      "data",
      "center",
      "cloud",
      "hyperscale",
      "equipment",
      "memory",
    ].forEach((token) => tokens.add(token));
  }
  if (tokens.has("ai")) {
    [
      "gpu",
      "accelerator",
      "compute",
      "server",
      "rack",
      "network",
      "networking",
      "cloud",
      "data",
      "center",
      "hyperscale",
    ].forEach((token) => tokens.add(token));
  }
  if (tokens.has("ev") || tokens.has("battery")) {
    ["lithium", "battery", "cell", "cathode", "vehicle", "automotive", "oem"].forEach((token) =>
      tokens.add(token),
    );
  }
  if (tokens.has("nuclear")) {
    ["uranium", "fuel", "reactor", "utility", "grid", "power"].forEach((token) =>
      tokens.add(token),
    );
  }

  return tokens;
}

function tokenMatches(token: string, field: string): boolean {
  const lower = field.toLowerCase();
  return lower.includes(token) || token.includes(lower);
}

function textHasTerm(text: string, term: string): boolean {
  if (term.includes(" ")) return text.includes(term);
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

function relevanceScore(seed: CompanySeed, tokens: Set<string>, selectedTickers: Set<string>): number {
  if (selectedTickers.has(seed.ticker)) return 1_000;

  let score = 0;
  const fields = [
    seed.name,
    seed.chain_position,
    ...seed.sector_tags,
    ...seed.keywords,
  ];
  for (const token of tokens) {
    if (seed.keywords.some((keyword) => tokenMatches(token, keyword))) score += 18;
    if (seed.sector_tags.some((tag) => tokenMatches(token, tag))) score += 14;
    if (fields.some((field) => tokenMatches(token, field))) score += 6;
  }
  return score;
}

function baseThroatScore(seed: CompanySeed): number {
  const breakdown = normalizeBreakdown(seed.breakdown);
  const replacementResistance = 100 - breakdown.replaceability;
  return round(
    breakdown.bottleneck_strength * 0.4 +
      breakdown.supply_chain_control * 0.25 +
      breakdown.industry_dependency * 0.2 +
      replacementResistance * 0.15,
    1,
  );
}

function seedToResearchCompany(seed: CompanySeed, profile: IndustryProfile, relevance: number): Company {
  const score = round(Math.min(95, baseThroatScore(seed) * 0.82 + Math.min(18, relevance / 8)), 1);
  return normalizeCompany({
    name: seed.name,
    ticker: seed.ticker,
    score,
    breakdown: normalizeBreakdown(seed.breakdown),
    throat_role: seed.throat_role,
    chain_position: `${seed.chain_position} → ${profile.label}`,
    why_bottleneck_or_not: seed.why_bottleneck_or_not,
  });
}

async function expandIndustryCoverage(
  profile: IndustryProfile,
  selectedCompanies: Company[],
): Promise<Company[]> {
  const selectedByTicker = new Map(selectedCompanies.map((company) => [company.ticker, company]));
  const selectedTickers = new Set(selectedByTicker.keys());
  const tokens = expandedIndustryTokens(profile);
  const ranked = COMPANY_UNIVERSE.map((seed) => ({
    seed,
    relevance: relevanceScore(seed, tokens, selectedTickers),
  }))
    .filter((row) => row.relevance >= 24 || selectedTickers.has(row.seed.ticker))
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        baseThroatScore(b.seed) - baseThroatScore(a.seed) ||
        a.seed.ticker.localeCompare(b.seed.ticker),
    )
    .slice(0, 14);

  const supplemental = ranked
    .filter((row) => !selectedByTicker.has(row.seed.ticker))
    .map((row) => seedToResearchCompany(row.seed, profile, row.relevance));
  const supplementalWithEvidence =
    supplemental.length > 0 ? await attachBitgetStockEvidence(supplemental) : [];

  const supplementalByTicker = new Map(
    supplementalWithEvidence.map((company) => [company.ticker, company]),
  );

  return ranked
    .map((row) => selectedByTicker.get(row.seed.ticker) ?? supplementalByTicker.get(row.seed.ticker))
    .filter((company): company is Company => company !== undefined);
}

function inferStage(company: Company, profile: IndustryProfile): IndustryMapStage {
  const role = company.selection_insight?.supply_role;
  if (role === "material_bottleneck" || role === "equipment_supplier") {
    return "upstream";
  }
  if (role === "downstream_consumer") {
    return "downstream";
  }
  if (
    role === "compute_provider" ||
    role === "infrastructure_enabler" ||
    role === "platform_controller"
  ) {
    return "midstream";
  }

  const text = `${company.chain_position} ${company.name}`.toLowerCase();
  const query = `${profile.label} ${profile.interpretation.user_input}`.toLowerCase();
  if (
    (query.includes("chip") || query.includes("semiconductor")) &&
    ["hyperscale", "cloud", "data center", "colocation", "oem", "vehicle"].some((keyword) =>
      textHasTerm(text, keyword),
    )
  ) {
    return "downstream";
  }
  if (
    [
      "material",
      "lithium",
      "uranium",
      "fuel",
      "foundry",
      "wafer",
      "fab",
      "lithography",
      "euv",
      "deposition",
      "etch",
      "oilfield",
      "upstream",
      "tier-1",
    ].some((keyword) => textHasTerm(text, keyword))
  ) {
    return "upstream";
  }
  if (
    [
      "oem",
      "vehicle",
      "consumer",
      "merchant",
      "payer",
      "hospital",
      "workflow",
      "exchange",
      "custody",
      "colocation",
    ].some((keyword) => textHasTerm(text, keyword))
  ) {
    return "downstream";
  }
  return "midstream";
}

function stageTitle(stage: IndustryMapStage): string {
  if (stage === "upstream") return "Upstream inputs and scarce capacity";
  if (stage === "midstream") return "Midstream production and platform control";
  return "Downstream demand and distribution";
}

function stagePurpose(stage: IndustryMapStage): string {
  if (stage === "upstream") {
    return "Find the qualified inputs, equipment, and capacity that the industry cannot scale without.";
  }
  if (stage === "midstream") {
    return "Find the conversion layer that turns scarce inputs into usable products or platforms.";
  }
  return "Find the end-market demand layer and companies exposed to adoption or distribution.";
}

function candlesToTrend(candles: BitgetCandle[], sourceHint: string): CompanyStockTrend {
  const usable = candles.filter((candle) => Number.isFinite(candle.close) && candle.close > 0);
  if (usable.length < 2) {
    return {
      status: "unavailable",
      source: "Bitget Public API",
      trend: "UNKNOWN",
      reason: `${sourceHint}; insufficient Bitget daily candles.`,
    };
  }

  const first = usable[0];
  const last = usable.at(-1)!;
  const totalReturn = round(((last.close - first.close) / first.close) * 100);
  const trend: StockTrendDirection =
    totalReturn > 3 ? "UP" : totalReturn < -3 ? "DOWN" : "FLAT";

  return {
    status: "verified",
    source: "Bitget Public API",
    trend,
    period: `${first.date} to ${last.date}`,
    observations: usable.length,
    total_return_pct: totalReturn,
    latest_close: round(last.close, 4),
    reason: `${sourceHint}; Bitget daily candles verify the displayed stock-token trend.`,
  };
}

function trendFromBacktestEvidence(
  symbol: string,
  backtest: BacktestValidation,
): CompanyStockTrend | null {
  const holding = backtest.evidence.holdings.find((row) => row.symbol === symbol);
  if (!holding) return null;
  return candlesToTrend(holding.candles, "Reused from strategy validation evidence");
}

async function buildTrend(company: Company, backtest: BacktestValidation): Promise<CompanyStockTrend> {
  const symbol = company.bitget_market?.symbol;
  if (!symbol || company.bitget_market?.status !== "online") {
    return {
      status: "unavailable",
      source: "Bitget Public API",
      trend: "UNKNOWN",
      reason: "Company is part of the industry research map, but no online Bitget stock-token market is available.",
    };
  }

  const evidenceTrend = trendFromBacktestEvidence(symbol, backtest);
  if (evidenceTrend) return evidenceTrend;

  try {
    const candles = await fetchBitgetDailyCandles(symbol, 120);
    return candlesToTrend(candles, "Fetched for industry-map stock trend");
  } catch {
    return {
      status: "unavailable",
      source: "Bitget Public API",
      trend: "UNKNOWN",
      reason: "Bitget market exists, but daily candle history could not be fetched for the industry map.",
    };
  }
}

export async function buildIndustryMap(
  profile: IndustryProfile,
  companies: Company[],
  backtest: BacktestValidation,
): Promise<IndustryMap> {
  const industryCoverage = await expandIndustryCoverage(profile, companies);
  const mappedCompanies = await Promise.all(
    industryCoverage.map(async (company): Promise<IndustryMapCompany> => {
      const stage = inferStage(company, profile);
      const trend = await buildTrend(company, backtest);
      return {
        ticker: company.ticker,
        name: company.name,
        stage,
        chain_position: company.chain_position,
        throat_role: company.throat_role,
        score: company.score,
        supply_role_label: company.selection_insight?.supply_role_label,
        bitget_symbol: company.bitget_market?.symbol,
        bitget_status: company.bitget_market?.status ?? "not_listed",
        last_price: company.bitget_market?.last_price,
        quote_volume_24h: company.bitget_market?.quote_volume_24h,
        stock_trend: trend,
      };
    }),
  );

  const layers = STAGE_ORDER.map((stage): IndustryMapLayer => {
    const rows = mappedCompanies
      .filter((company) => company.stage === stage)
      .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));
    return {
      stage,
      title: stageTitle(stage),
      purpose: stagePurpose(stage),
      companies: rows,
      bottleneck_count: rows.filter((company) => company.throat_role === "CORE BOTTLENECK")
        .length,
      bitget_online_count: rows.filter((company) => company.bitget_status === "online").length,
    };
  });

  return {
    source: "ThroatScan structured industry map",
    thesis: `Break ${profile.label} into upstream, midstream, and downstream public-company exposures before selecting tradable Bitget stock tokens.`,
    scope_note:
      "The map covers public-company candidates selected by the reasoning engine. Bitget tradability is a separate execution gate.",
    stock_trend_note:
      "Stock trend uses Bitget public stock-token candles only when an online Bitget symbol exists; otherwise the company remains research-only.",
    layers,
    generated_at: new Date().toISOString(),
  };
}
