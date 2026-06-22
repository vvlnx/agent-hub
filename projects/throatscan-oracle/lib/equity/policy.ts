import type {
  BitgetEquityInstrument,
  BitgetEquityResolution,
  ExecutionTier,
  TradabilityState,
} from "./types";

const PRODUCT_PRIORITY: Array<BitgetEquityInstrument["product_line"]> = [
  "us_stocks_direct",
  "rtoken_spot",
  "ondo_spot",
];

export function rankInstruments(instruments: BitgetEquityInstrument[]): BitgetEquityInstrument[] {
  return [...instruments].sort((a, b) => {
    const tierDiff = executionTierForInstrument(a) - executionTierForInstrument(b);
    if (tierDiff !== 0) return tierDiff;
    const productDiff =
      PRODUCT_PRIORITY.indexOf(a.product_line) - PRODUCT_PRIORITY.indexOf(b.product_line);
    if (productDiff !== 0) return productDiff;
    return a.symbol.localeCompare(b.symbol);
  });
}

export function executionTierForInstrument(instrument: BitgetEquityInstrument): number {
  if (instrument.product_line === "ondo_spot" || instrument.product_line === "rtoken_spot") {
    return instrument.tradability === "executable_now" ? 0 : 1;
  }
  if (instrument.product_line === "us_stocks_direct") {
    return instrument.tradability === "listed_no_api" ? 2 : 3;
  }
  return 4;
}

export function tierFromResolution(resolution: BitgetEquityResolution): ExecutionTier {
  return resolution.execution_tier;
}

export function isEquityExecutable(instrument?: BitgetEquityInstrument): boolean {
  return instrument?.tradability === "executable_now";
}

export function isEquityEvidenceReady(instrument?: BitgetEquityInstrument): boolean {
  return Boolean(instrument && instrument.listed && instrument.status === "online");
}

export function isAppHandoffTier(tier: ExecutionTier): boolean {
  return tier === "B";
}

export function isAutoExecutableTier(tier: ExecutionTier): boolean {
  return tier === "A";
}

export function tradabilityLabelEn(state: TradabilityState): string {
  const map: Record<TradabilityState, string> = {
    executable_now: "API executable now",
    executable_session: "Listed; session closed",
    listed_no_api: "Bitget App only (no API)",
    research_only: "Research only",
    region_blocked: "Region ineligible",
  };
  return map[state];
}

export function tradabilityLabelZh(state: TradabilityState): string {
  const map: Record<TradabilityState, string> = {
    executable_now: "API 可立即执行",
    executable_session: "已上线；当前非交易时段",
    listed_no_api: "仅 Bitget App（无 API）",
    research_only: "仅研究",
    region_blocked: "地区不可用",
  };
  return map[state];
}
