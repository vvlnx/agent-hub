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
  app_handoff_available: boolean;
  research_conclusion_valid: boolean;
  execution_tier_summary_en: string;
  execution_tier_summary_zh: string;
  app_handoff_tickers: string[];
  app_handoff_plans: import("../equity/types").ExecutionHandoff[];
  summary_en: string;
  summary_zh: string;
  research_only_tickers: string[];
  online_proxy_options: TradabilityProxyOption[];
  recommended_action_en: string;
  recommended_action_zh: string;
}

export type AgentWorkflowStatus = "complete" | "partial" | "skipped";

export interface AgentWorkflowStep {
  id: string;
  agent_en: string;
  agent_zh: string;
  skill: string;
  tools_used: string[];
  status: AgentWorkflowStatus;
  detail_en: string;
  detail_zh: string;
  fetched_at?: string;
  source_url?: string;
}

export interface HardConstraintRule {
  id: string;
  label_en: string;
  label_zh: string;
  enforced_en: string;
  enforced_zh: string;
}

export interface GrowthRoadmapPhase {
  phase: number;
  title_en: string;
  title_zh: string;
  status: "live" | "partial" | "planned";
  items_en: string[];
  items_zh: string[];
}

export interface RebalanceAgentPlan {
  agent_id: string;
  status: "ready" | "idle";
  policy_en: string;
  policy_zh: string;
  triggers_en: string[];
  triggers_zh: string[];
  next_action_en: string;
  next_action_zh: string;
  backtest_rebalance_events: number;
}

export interface NoveltyPack {
  why_agent_only_en: string;
  why_agent_only_zh: string;
  vs_traditional_screener_en: string[];
  vs_traditional_screener_zh: string[];
  agent_workflow: AgentWorkflowStep[];
  hard_constraints: HardConstraintRule[];
  growth_roadmap: GrowthRoadmapPhase[];
  rebalance_agent: RebalanceAgentPlan;
  bitget_online_stock_token_count: number;
  bitget_catalog_ticker_count: number;
  bitget_tier_a_count: number;
  bitget_tier_b_count: number;
  discovery_candidate_count: number;
  fixed_universe_size: number;
  mcp_url: string;
  mcp_tools_used: string[];
}

export interface CompletenessPack {
  schema_version: "throatscan-completeness-v1";
  public_demo_url: string;
  github_repo_url: string | null;
  end_to_end_stages: EndToEndStage[];
  judge_self_assessment: JudgeRubricRow[];
  tradability_guide: TradabilityGuide;
  novelty: NoveltyPack;
  honest_summary_en: string;
  honest_summary_zh: string;
  generated_at: string;
}
