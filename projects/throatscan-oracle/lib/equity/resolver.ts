import { COMPANY_UNIVERSE } from "../companyUniverse";
import {
  executionTierForTicker,
  loadEquityCatalog,
  normalizeTicker,
} from "./catalog";
import {
  isAppHandoffTier,
  isAutoExecutableTier,
  isEquityExecutable,
  rankInstruments,
} from "./policy";
import type {
  AnalysisGrade,
  BitgetEquityEvidence,
  BitgetEquityResolution,
  EvidenceGrade,
  ExecutionHandoff,
  ExecutionTier,
  NonTradableReasonCode,
} from "./types";

const CURATED_TICKERS = new Set(COMPANY_UNIVERSE.map((company) => company.ticker.toUpperCase()));

export function analysisGradeForTicker(ticker: string): AnalysisGrade {
  return CURATED_TICKERS.has(normalizeTicker(ticker)) ? "deep" : "wide";
}

export function evidenceGradeForTier(tier: ExecutionTier): EvidenceGrade {
  if (tier === "A") return "executable";
  if (tier === "B") return "reference";
  return "unavailable";
}

export async function resolveTradability(ticker: string): Promise<BitgetEquityResolution> {
  const normalized = normalizeTicker(ticker);
  const { by_ticker, snapshot } = await loadEquityCatalog();
  const instruments = by_ticker.get(normalized) ?? [];
  const ranked = rankInstruments(instruments);
  const execution_tier = executionTierForTicker(normalized, ranked);
  const execution_instrument = ranked.find((instrument) => isEquityExecutable(instrument)) ?? ranked[0];

  let non_tradable_reason: NonTradableReasonCode | undefined;
  if (execution_tier === "C") {
    non_tradable_reason = "NOT_LISTED";
  } else if (execution_tier === "B") {
    non_tradable_reason = "API_UNSUPPORTED";
  }

  return {
    ticker: normalized,
    execution_tier,
    primary: ranked[0],
    instruments: ranked,
    execution_instrument,
    non_tradable_reason,
    catalog_as_of: snapshot.app_catalog_as_of,
  };
}

export function buildExecutionHandoff(ticker: string): ExecutionHandoff {
  const normalized = normalizeTicker(ticker);
  return {
    ticker: normalized,
    channel: "bitget_us_stocks_app",
    funding: {
      deposit: "USDC",
      transfer: "Main account → US Stocks securities account",
    },
    steps_en: [
      "Deposit or buy USDC in your Bitget main account.",
      "Transfer USDC to your Bitget US Stocks securities account.",
      `Search ${normalized} in the Bitget App US Stocks section.`,
      "Place a market or limit order in USD during supported trading hours.",
    ],
    steps_zh: [
      "在 Bitget 主账户充值或购买 USDC。",
      "将 USDC 划转至 Bitget 美股证券账户。",
      `在 Bitget App 美股专区搜索 ${normalized}。`,
      "在支持的交易时段内以 USD 下市价或限价单。",
    ],
    disclaimer_en:
      "Bitget US Stocks direct trading has no public API yet. This handoff is guidance only; verify eligibility and hours in the Bitget App.",
    disclaimer_zh:
      "Bitget 美股直连尚无公开 API。以下仅为操作指引；请在 Bitget App 内确认资格与交易时段。",
  };
}

export function buildEquityEvidence(
  resolution: BitgetEquityResolution,
  fetchedAt: string,
  errorMessage?: string,
): BitgetEquityEvidence {
  const analysis_grade = analysisGradeForTicker(resolution.ticker);
  const evidence_grade = evidenceGradeForTier(resolution.execution_tier);

  return {
    underlying_ticker: resolution.ticker,
    execution_tier: resolution.execution_tier,
    evidence_grade,
    analysis_grade,
    primary_instrument: resolution.primary,
    execution_instrument: resolution.execution_instrument,
    instruments: resolution.instruments,
    non_tradable_reason: resolution.non_tradable_reason,
    catalog_as_of: resolution.catalog_as_of,
    fetched_at: fetchedAt,
    error_message: errorMessage,
  };
}

export function legacyMarketFromEvidence(
  evidence: BitgetEquityEvidence,
): import("../bitgetStocks").BitgetStockMarketEvidence {
  const instrument =
    evidence.execution_instrument ??
    evidence.primary_instrument ??
    evidence.instruments[0];

  if (!instrument) {
    return {
      source: "Bitget Public API",
      underlying_ticker: evidence.underlying_ticker,
      listed: false,
      status: "not_listed",
      fetched_at: evidence.fetched_at,
      error_message: evidence.error_message,
    };
  }

  return {
    source: "Bitget Public API",
    underlying_ticker: evidence.underlying_ticker,
    symbol: instrument.symbol,
    listed: instrument.listed,
    status: instrument.status,
    last_price: instrument.last_price,
    quote_volume_24h: instrument.quote_volume_24h,
    bid_price: instrument.bid_price,
    ask_price: instrument.ask_price,
    spread_bps: instrument.spread_bps,
    min_trade_usdt: instrument.min_notional,
    maker_fee_rate: instrument.maker_fee_rate,
    taker_fee_rate: instrument.taker_fee_rate,
    market_timestamp: instrument.market_timestamp,
    fetched_at: evidence.fetched_at,
    error_message: evidence.error_message,
  };
}

export function companyIsApiExecutable(company: {
  bitget_equity?: BitgetEquityEvidence;
  bitget_market?: { status?: string; symbol?: string; listed?: boolean };
}): boolean {
  if (company.bitget_equity) {
    return isAutoExecutableTier(company.bitget_equity.execution_tier);
  }
  return Boolean(
    company.bitget_market?.listed &&
      company.bitget_market.status === "online" &&
      company.bitget_market.symbol,
  );
}

export function companyIsAppHandoff(company: {
  bitget_equity?: BitgetEquityEvidence;
}): boolean {
  return company.bitget_equity ? isAppHandoffTier(company.bitget_equity.execution_tier) : false;
}

export function companyHasBitgetListing(company: {
  bitget_equity?: BitgetEquityEvidence;
  bitget_market?: { status?: string; listed?: boolean };
}): boolean {
  if (company.bitget_equity) {
    return company.bitget_equity.execution_tier === "A" || company.bitget_equity.execution_tier === "B";
  }
  return Boolean(company.bitget_market?.listed && company.bitget_market.status === "online");
}

export { isAutoExecutableTier, isAppHandoffTier };
