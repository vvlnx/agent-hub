export type EquityProductLine = "ondo_spot" | "rtoken_spot" | "us_stocks_direct";

export type ExecutionTier = "A" | "B" | "C";

export type TradabilityState =
  | "executable_now"
  | "executable_session"
  | "listed_no_api"
  | "research_only"
  | "region_blocked";

export type AnalysisGrade = "deep" | "wide" | "reference";

export type EvidenceGrade = "executable" | "reference" | "proxy" | "unavailable";

export type NonTradableReasonCode =
  | "NOT_LISTED"
  | "SESSION_CLOSED"
  | "API_UNSUPPORTED"
  | "REGION_INELIGIBLE"
  | "MIN_NOTIONAL"
  | "ONLY_PROXY_AVAILABLE";

export interface BitgetEquityInstrument {
  underlying_ticker: string;
  product_line: EquityProductLine;
  symbol: string;
  quote_currency: "USDT" | "USDC" | "USD";
  settlement_currency: "USDT" | "USD";
  listed: boolean;
  status: "online" | "offline" | "not_listed";
  tradability: TradabilityState;
  last_price?: number;
  quote_volume_24h?: number;
  bid_price?: number;
  ask_price?: number;
  spread_bps?: number;
  min_notional?: number;
  maker_fee_rate?: number;
  taker_fee_rate?: number;
  market_timestamp?: string;
}

export interface BitgetEquityResolution {
  ticker: string;
  execution_tier: ExecutionTier;
  primary?: BitgetEquityInstrument;
  instruments: BitgetEquityInstrument[];
  execution_instrument?: BitgetEquityInstrument;
  non_tradable_reason?: NonTradableReasonCode;
  catalog_as_of?: string;
}

export interface BitgetEquityEvidence {
  underlying_ticker: string;
  execution_tier: ExecutionTier;
  evidence_grade: EvidenceGrade;
  analysis_grade: AnalysisGrade;
  primary_instrument?: BitgetEquityInstrument;
  execution_instrument?: BitgetEquityInstrument;
  instruments: BitgetEquityInstrument[];
  non_tradable_reason?: NonTradableReasonCode;
  catalog_as_of?: string;
  fetched_at: string;
  error_message?: string;
}

export interface ExecutionHandoff {
  ticker: string;
  channel: "bitget_us_stocks_app";
  funding: {
    deposit: "USDC";
    transfer: "Main account → US Stocks securities account";
  };
  steps_en: string[];
  steps_zh: string[];
  disclaimer_en: string;
  disclaimer_zh: string;
}

export interface BitgetDiscoveryEntry {
  ticker: string;
  name?: string;
  sector_hint?: string;
  gics_code?: string;
  discovery_via?: "sector_hint" | "gics_prefix";
  execution_tier: ExecutionTier;
  in_curated_universe: boolean;
}

export interface BitgetCatalogSnapshot {
  fetched_at: string;
  app_catalog_as_of: string;
  counts: {
    ondo_spot_online: number;
    rtoken_online: number;
    us_stocks_app: number;
    total_unique_tickers: number;
  };
}

export interface BitgetDiscoveryResult {
  curated_count: number;
  discovery_count: number;
  entries: BitgetDiscoveryEntry[];
  summary_en: string;
  summary_zh: string;
  gics_code_prefix?: string;
  gics_peers_scanned?: number;
}
