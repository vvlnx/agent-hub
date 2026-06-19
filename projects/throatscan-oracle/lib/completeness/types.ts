export type RubricDimensionId =
  | "thesis_depth"
  | "runnability"
  | "completeness"
  | "novelty_potential";

export interface JudgeRubricRow {
  id: RubricDimensionId;
  title_en: string;
  title_zh: string;
  achieved_en: string[];
  achieved_zh: string[];
  gaps_en: string[];
  gaps_zh: string[];
  rating_en: string;
  rating_zh: string;
}

export interface EndToEndStage {
  id: string;
  label_en: string;
  label_zh: string;
  status: "complete" | "partial" | "skipped";
  detail_en: string;
  detail_zh: string;
}

export interface TradabilityProxyOption {
  ticker: string;
  bitget_symbol: string;
  role_en: string;
  role_zh: string;
  reason_en: string;
  reason_zh: string;
}

export interface TradabilityGuide {
  direct_execution_available: boolean;
  research_conclusion_valid: boolean;
  summary_en: string;
  summary_zh: string;
  research_only_tickers: string[];
  online_proxy_options: TradabilityProxyOption[];
  recommended_action_en: string;
  recommended_action_zh: string;
}

export interface CompletenessPack {
  schema_version: "throatscan-completeness-v1";
  public_demo_url: string;
  github_repo_url: string | null;
  end_to_end_stages: EndToEndStage[];
  judge_self_assessment: JudgeRubricRow[];
  tradability_guide: TradabilityGuide;
  honest_summary_en: string;
  honest_summary_zh: string;
  generated_at: string;
}
