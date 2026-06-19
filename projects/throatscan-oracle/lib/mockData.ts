import type { BacktestValidation } from "./backtest";
import type { Company, ThroatScanConclusion } from "./types";
import type { FinalDecisionLayer } from "./decisionLayer";
import type { MarketResearch } from "./marketResearch";
import type { EventIntelligence } from "./eventIntelligence";
import type { IndustryMap } from "./industryMap";
import type { ThesisAudit } from "./thesisAudit";
import { normalizeCompany } from "./types";
import type { LLMResearchSource } from "./llm/types";
import type { GroundingMode } from "./rulesModeGrounding";
import type { UniverseCoverage } from "./universeCoverage";
import type { CompletenessPack } from "./completeness/types";

export interface ChainNode {
  name: string;
  description: string;
  stage: "upstream" | "midstream" | "downstream";
}

export interface CompanySeed {
  name: string;
  ticker: string;
  chain_position: string;
  throat_role: import("./types").ThroatRole;
  why_bottleneck_or_not: import("./types").WhyBottleneckOrNot;
  breakdown: Partial<import("./types").CompanyBreakdown>;
  sector_tags: string[];
  keywords: string[];
}

export interface IndustryInterpretation {
  user_input: string;
  display_label: string;
  sector_tags: string[];
  archetype: SupplyChainArchetype;
  inference_mode: "constrained" | "constrained_llm" | "llm_remote";
  bottleneck_hint?: string;
  primary_bottleneck_ticker?: string;
  demand_driver?: string;
  end_market?: string;
  selection_rationale?: string;
  confidence?: number;
  summary_en?: string;
  research_sources?: LLMResearchSource[];
  research_queries?: string[];
  web_search_used?: boolean;
  grounding_mode?: GroundingMode;
}

export type SupplyChainArchetype =
  | "compute_hardware"
  | "ai_infrastructure"
  | "platform_software"
  | "energy_materials"
  | "healthcare"
  | "defense"
  | "robotics"
  | "general";

export interface IndustryProfile {
  label: string;
  interpretation: IndustryInterpretation;
  summary: string;
  selection_rationale: string;
  reasoning_chain: string[];
  bottleneck_location: string;
  primary_bottleneck_ticker: string;
  chain: ChainNode[];
  companies: CompanySeed[];
  reasoning: import("./reasoning/types").ReasoningResult;
}

export interface AnalysisResult {
  industry: string;
  interpretation: IndustryInterpretation;
  summary: string;
  selection_rationale: string;
  reasoning_chain: string[];
  structured_report: import("./reasoning/structuredReport").StructuredReasoningReport;
  audit_trail: import("./reasoning/auditTrail").CompanyAuditRecord[];
  confidence: number;
  confidence_level: import("./reasoning/types").ConfidenceLevel;
  uncertain_mapping: boolean;
  uncertainty_message?: string;
  low_confidence: boolean;
  chain: ChainNode[];
  companies: Company[];
  conclusion: ThroatScanConclusion;
  final_decision: FinalDecisionLayer;
  reasoning_intelligence: import("./reasoning/intelligenceLayer").ReasoningIntelligence;
  market_research: MarketResearch;
  event_intelligence: EventIntelligence;
  industry_map: IndustryMap;
  thesis_audit: ThesisAudit;
  universe_coverage: UniverseCoverage;
  completeness: CompletenessPack;
  backtest: BacktestValidation;
  meta?: {
    llm_enabled: boolean;
    llm_configured: boolean;
    llm_requested: boolean;
    llm_model?: string;
    llm_api: "responses";
    llm_web_search_enabled: boolean;
    llm_web_search_used: boolean;
    llm_source_count: number;
    inference_mode: IndustryInterpretation["inference_mode"];
  };
  analyzedAt: string;
}

export function normalizeAnalysisCompanies(companies: Company[]): Company[] {
  return companies.map((company) => normalizeCompany(company));
}
