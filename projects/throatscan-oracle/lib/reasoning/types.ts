import type { ChainNode, CompanySeed } from "../mockData";
import type { CompanyAuditRecord } from "./auditTrail";
import type { SelectionConstraint } from "./constraints";
import type { StructuredReasoningReport, FinalRankingEntry } from "./structuredReport";

export type SupplyLayerId = "demand" | "infrastructure" | "core_technology" | "materials";

export type ConstraintType = "supply" | "switching" | "capacity";

export type SupplyRole =
  | "compute_provider"
  | "equipment_supplier"
  | "material_bottleneck"
  | "downstream_consumer"
  | "infrastructure_enabler"
  | "platform_controller";

export type ConfidenceLevel = "HIGH" | "LOW";

export interface IndustryIntent {
  raw_input: string;
  normalized_query: string;
  display_label: string;
  demand_driver: string;
  end_market: string;
  sector_signals: string[];
  physical_intensity: number;
  regulation_intensity: number;
  confidence?: number;
}

export interface SupplyChainLayer {
  id: SupplyLayerId;
  name: string;
  description: string;
  stage: ChainNode["stage"];
  constraint_score: number;
  switching_cost_score: number;
  capacity_limit_score: number;
  composite_pressure: number;
}

export interface BottleneckInsight {
  primary_layer: SupplyLayerId;
  constraint_type: ConstraintType;
  location_description: string;
  rationale: string;
}

export interface CompanyMatchReason {
  ticker: string;
  supply_role: SupplyRole;
  supply_role_label: string;
  sector_similarity: number;
  role_fit: number;
  dependency_exposure: number;
  substitution_difficulty: number;
  composite: number;
  mapped_layer: SupplyLayerId;
  why_selected: string;
  why_not_others: string;
  depends_on: string;
  match_confidence: number;
  constraints_met: SelectionConstraint[];
  proxy_note?: string;
}

export interface ReasoningResult {
  intent: IndustryIntent;
  layers: SupplyChainLayer[];
  bottleneck: BottleneckInsight;
  company_matches: CompanyMatchReason[];
  selected_companies: CompanySeed[];
  chain_nodes: ChainNode[];
  reasoning_chain: string[];
  structured_report: StructuredReasoningReport;
  audit_trail: CompanyAuditRecord[];
  final_ranking: FinalRankingEntry[];
  primary_bottleneck_ticker: string;
  summary: string;
  selection_rationale: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
  uncertain_mapping: boolean;
  uncertainty_message?: string;
  inference_mode: "constrained" | "constrained_llm";
  reasoning_intelligence?: import("./intelligenceLayer").ReasoningIntelligence;
}

export interface ReasoningScoreContext {
  primary_layer: SupplyLayerId;
  constraint_type: ConstraintType;
  sector_signals: string[];
  company_match?: CompanyMatchReason;
}
