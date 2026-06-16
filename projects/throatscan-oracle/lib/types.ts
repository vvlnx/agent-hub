export type ThroatRole =
  | "CORE BOTTLENECK"
  | "STRATEGIC ENABLER"
  | "DOWNSTREAM USER"
  | "PERIPHERAL EXPOSURE";

export interface WhyBottleneckOrNot {
  scarce_resource: string;
  can_function_without: string;
  replaceability_1_to_3_years: string;
}

export interface CompanyBreakdown {
  bottleneck_strength: number;
  supply_chain_control: number;
  replaceability: number;
  industry_dependency: number;
}

export interface Company {
  name: string;
  ticker: string;
  score: number;
  breakdown: CompanyBreakdown;
  throat_role: ThroatRole;
  chain_position: string;
  why_bottleneck_or_not: WhyBottleneckOrNot;
  bitget_market?: import("./bitgetStocks").BitgetStockMarketEvidence;
  event_adjustment?: import("./eventIntelligence").CompanyEventAdjustment;
  selection_insight?: {
    supply_role: string;
    supply_role_label: string;
    why_selected: string;
    why_not_others: string;
    depends_on: string;
    match_confidence: number;
    constraints_met: string[];
    uncertainty_confidence?: "HIGH" | "MEDIUM" | "LOW";
    uncertainty_reason?: string;
  };
}

export interface ThroatScanConclusion {
  bottleneck_location: string;
  primary_bottleneck: Company;
  high_score_non_bottlenecks: Company[];
  narrative: string;
}

export const EMPTY_WHY: WhyBottleneckOrNot = {
  scarce_resource: "",
  can_function_without: "",
  replaceability_1_to_3_years: "",
};

export const EMPTY_BREAKDOWN: CompanyBreakdown = {
  bottleneck_strength: 0,
  supply_chain_control: 0,
  replaceability: 0,
  industry_dependency: 0,
};

export const BREAKDOWN_FIELDS: (keyof CompanyBreakdown)[] = [
  "bottleneck_strength",
  "supply_chain_control",
  "replaceability",
  "industry_dependency",
];

export const BREAKDOWN_LABELS: Record<keyof CompanyBreakdown, string> = {
  bottleneck_strength: "Bottleneck Strength",
  supply_chain_control: "Supply Chain Control",
  replaceability: "Replaceability (high = easy to replace)",
  industry_dependency: "Industry Dependency",
};

export const DEFAULT_THROAT_ROLE: ThroatRole = "PERIPHERAL EXPOSURE";

export function normalizeWhy(
  partial?: Partial<WhyBottleneckOrNot> | null,
): WhyBottleneckOrNot {
  return {
    scarce_resource: partial?.scarce_resource ?? "",
    can_function_without: partial?.can_function_without ?? "",
    replaceability_1_to_3_years: partial?.replaceability_1_to_3_years ?? "",
  };
}

export function normalizeBreakdown(
  partial?: Partial<CompanyBreakdown> | null,
): CompanyBreakdown {
  return {
    bottleneck_strength: partial?.bottleneck_strength ?? 0,
    supply_chain_control: partial?.supply_chain_control ?? 0,
    replaceability: partial?.replaceability ?? 0,
    industry_dependency: partial?.industry_dependency ?? 0,
  };
}

export function normalizeCompany(partial?: Partial<Company> | null): Company {
  return {
    name: partial?.name ?? "",
    ticker: partial?.ticker ?? "",
    score: partial?.score ?? 0,
    breakdown: normalizeBreakdown(partial?.breakdown),
    throat_role: partial?.throat_role ?? DEFAULT_THROAT_ROLE,
    chain_position: partial?.chain_position ?? "",
    why_bottleneck_or_not: normalizeWhy(partial?.why_bottleneck_or_not),
    bitget_market: partial?.bitget_market,
    event_adjustment: partial?.event_adjustment,
    selection_insight: partial?.selection_insight,
  };
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function isCoreBottleneck(role: ThroatRole): boolean {
  return role === "CORE BOTTLENECK";
}
