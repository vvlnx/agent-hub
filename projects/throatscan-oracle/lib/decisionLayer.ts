import type { Company, ThroatRole } from "./types";
import { isCoreBottleneck, normalizeCompany } from "./types";
import type { IndustryProfile } from "./mockData";
import type { ReasoningResult } from "./reasoning/types";

export type InvestmentStance = "STRONG FOCUS" | "SECONDARY" | "IGNORE";

export interface DecisionCompany {
  ticker: string;
  name: string;
  throat_role: ThroatRole;
  score: number;
  base_score: number;
  confidence_delta: number;
  investment_stance: InvestmentStance;
  supply_role_label?: string;
  reason: string;
  event_reason_en?: string;
  event_reason_zh?: string;
}

export interface DecisionSummary {
  one_line_conclusion: string;
  investment_stances: Array<{
    ticker: string;
    role: ThroatRole;
    stance: InvestmentStance;
  }>;
}

export interface TraditionalVsThroatScan {
  traditional: {
    label: string;
    metrics: string[];
    top_picks: string[];
    limitation: string;
  };
  throatscan: {
    label: string;
    metrics: string[];
    top_picks: string[];
    advantage: string;
  };
}

export interface FinalResultCard {
  industry: string;
  core_bottleneck: string;
  reason: string;
  confidence: string;
  investment_stance: InvestmentStance;
}

export interface FinalDecisionLayer {
  primary_bottleneck: DecisionCompany;
  secondary_bottlenecks: DecisionCompany[];
  non_bottleneck_companies: DecisionCompany[];
  decision_summary: DecisionSummary;
  traditional_vs_throatscan: TraditionalVsThroatScan;
  key_advantages: string[];
  final_result_card: FinalResultCard;
}

function investmentStanceForRole(role: ThroatRole): InvestmentStance {
  if (role === "CORE BOTTLENECK") return "STRONG FOCUS";
  if (role === "STRATEGIC ENABLER" || role === "DOWNSTREAM USER") return "SECONDARY";
  return "IGNORE";
}

function investmentStanceForCompany(company: Company): InvestmentStance {
  const action = company.event_adjustment?.recommended_action;
  if (action === "AVOID") return "IGNORE";
  if (action === "WATCH") return "SECONDARY";
  return investmentStanceForRole(company.throat_role);
}

function isSecondaryBottleneck(company: Company, primaryTicker: string): boolean {
  if (company.ticker === primaryTicker) return false;
  if (isCoreBottleneck(company.throat_role)) return true;

  const strength = company.breakdown.bottleneck_strength;
  const control = company.breakdown.supply_chain_control;
  const role = company.selection_insight?.supply_role;

  return (
    company.throat_role === "STRATEGIC ENABLER" &&
    (strength >= 78 || control >= 82) &&
    (role === "material_bottleneck" ||
      role === "compute_provider" ||
      role === "equipment_supplier")
  );
}

function buildDecisionReason(company: Company, profile: IndustryProfile): string {
  const scarce = company.why_bottleneck_or_not.scarce_resource;
  if (scarce) {
    return scarce.split(".")[0] ?? scarce;
  }
  if (company.selection_insight?.why_selected) {
    return company.selection_insight.why_selected.split(".")[0] ?? company.selection_insight.why_selected;
  }
  return `Structural exposure at ${profile.bottleneck_location}.`;
}

function traditionalScore(company: Company): number {
  const b = company.breakdown;
  const peProxy = 100 - b.bottleneck_strength;
  const epsGrowthProxy = b.industry_dependency;
  const momentumProxy = 100 - b.replaceability;
  return peProxy * 0.35 + epsGrowthProxy * 0.35 + momentumProxy * 0.3;
}

function toDecisionCompany(company: Company, profile: IndustryProfile): DecisionCompany {
  const normalized = normalizeCompany(company);
  return {
    ticker: normalized.ticker,
    name: normalized.name,
    throat_role: normalized.throat_role,
    score: normalized.score,
    base_score: normalized.event_adjustment?.base_score ?? normalized.score,
    confidence_delta: normalized.event_adjustment?.confidence_delta ?? 0,
    investment_stance: investmentStanceForCompany(normalized),
    supply_role_label: normalized.selection_insight?.supply_role_label,
    reason: buildDecisionReason(normalized, profile),
    event_reason_en: normalized.event_adjustment?.explanation_en,
    event_reason_zh: normalized.event_adjustment?.explanation_zh,
  };
}

function resolvePrimary(
  companies: Company[],
  profile: IndustryProfile,
): Company {
  const normalized = companies.map((c) => normalizeCompany(c));
  const fromProfile = normalized.find((c) => c.ticker === profile.primary_bottleneck_ticker);
  const fromRole = normalized
    .filter((c) => isCoreBottleneck(c.throat_role))
    .sort((a, b) => b.score - a.score)[0];

  return normalizeCompany(fromProfile ?? fromRole ?? normalized[0]);
}

function buildOneLineConclusion(
  industry: string,
  primary: DecisionCompany,
  reasoning: ReasoningResult,
): string {
  const because =
    primary.reason ||
    reasoning.bottleneck.rationale.split(".")[0] ||
    `it controls the ${reasoning.bottleneck.primary_layer.replace(/_/g, " ")} choke point`;

  return `In ${industry}, the real control point is ${primary.ticker} (${primary.name}) because ${because.toLowerCase().replace(/^it /, "")}.`;
}

export function buildFinalDecisionLayer(
  profile: IndustryProfile,
  companies: Company[],
  reasoning: ReasoningResult,
): FinalDecisionLayer {
  const ranked = companies.map((c) => normalizeCompany(c)).slice(0, 5);
  const primaryRaw = resolvePrimary(ranked, profile);
  const primary = toDecisionCompany(primaryRaw, profile);

  const secondary_bottlenecks = ranked
    .filter((c) => isSecondaryBottleneck(c, primary.ticker))
    .map((c) => toDecisionCompany(c, profile));

  const secondaryTickers = new Set(secondary_bottlenecks.map((c) => c.ticker));
  const non_bottleneck_companies = ranked
    .filter((c) => c.ticker !== primary.ticker && !secondaryTickers.has(c.ticker))
    .map((c) => toDecisionCompany(c, profile));

  const traditionalRanked = [...ranked].sort(
    (a, b) => traditionalScore(b) - traditionalScore(a) || a.ticker.localeCompare(b.ticker),
  );
  const throatscanRanked = [...ranked];

  const decision_summary: DecisionSummary = {
    one_line_conclusion: buildOneLineConclusion(profile.label, primary, reasoning),
    investment_stances: ranked.map((c) => ({
      ticker: c.ticker,
      role: c.throat_role,
      stance: investmentStanceForCompany(c),
    })),
  };

  const traditional_vs_throatscan: TraditionalVsThroatScan = {
    traditional: {
      label: "Traditional equity screening",
      metrics: ["P/E ratio", "EPS growth", "Revenue momentum"],
      top_picks: traditionalRanked.slice(0, 3).map((c) => c.ticker),
      limitation:
        "Ranks visible financial momentum — often misses who actually controls scarce inputs.",
    },
    throatscan: {
      label: "ThroatScan bottleneck screening",
      metrics: [
        "Supply chain control",
        "Bottleneck dependency",
        "Replaceability (1–3 years)",
      ],
      top_picks: throatscanRanked.slice(0, 3).map((c) => c.ticker),
      advantage:
        "Surfaces structural choke points even when financial multiples look ordinary.",
    },
  };

  const key_advantages = [
    "Captures hidden supply chain control points that P/E and EPS screens cannot see.",
    "Identifies non-obvious market power — bottlenecks are often upstream, not the brand-name end user.",
    "Focuses on structural dependency and replaceability instead of price-based metrics alone.",
  ];

  const confidenceLabel =
    reasoning.confidence_level === "LOW"
      ? `LOW (${reasoning.confidence}/100)`
      : `HIGH (${reasoning.confidence}/100)`;

  const final_result_card: FinalResultCard = {
    industry: profile.label,
    core_bottleneck: `${primary.ticker} — ${primary.name}`,
    reason: primary.reason,
    confidence: confidenceLabel,
    investment_stance: primary.investment_stance,
  };

  return {
    primary_bottleneck: primary,
    secondary_bottlenecks,
    non_bottleneck_companies,
    decision_summary,
    traditional_vs_throatscan,
    key_advantages,
    final_result_card,
  };
}
