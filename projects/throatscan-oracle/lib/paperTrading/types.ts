export type PaperTradingMode = "bitget_demo" | "local_paper" | "disconnected";

export type RunnabilityLevel = "backtest_only" | "local_paper" | "bitget_demo";

export interface PaperOrder {
  order_id: string;
  run_id: string;
  symbol: string;
  underlying_ticker: string;
  side: "buy";
  order_type: "market";
  quote_size_usdt: number;
  reference_price?: number;
  status: "filled_local" | "submitted_demo" | "failed";
  venue: "local_paper" | "bitget_demo";
  reason: string;
  created_at: string;
  bitget_order_id?: string;
  error_message?: string;
}

export interface PaperTradingStatus {
  mode: PaperTradingMode;
  runnability_level: RunnabilityLevel;
  demo_configured: boolean;
  public_market_live: boolean;
  message_en: string;
  message_zh: string;
  balance_usdt?: number;
  recent_orders_count: number;
  last_checked_at: string;
}

export interface PaperBasketRequest {
  run_id: string;
  industry: string;
  tickers: string[];
  rationale: string;
  quote_size_usdt?: number;
}

export interface PaperBasketResult {
  mode: PaperTradingMode;
  runnability_level: RunnabilityLevel;
  orders: PaperOrder[];
  summary_en: string;
  summary_zh: string;
}
