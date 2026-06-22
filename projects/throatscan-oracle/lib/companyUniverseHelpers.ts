import type { CompanyBreakdown, ThroatRole, WhyBottleneckOrNot } from "./types";
import type { CompanySeed } from "./mockData";

export function why(
  scarce_resource: string,
  can_function_without: string,
  replaceability_1_to_3_years: string,
): WhyBottleneckOrNot {
  return { scarce_resource, can_function_without, replaceability_1_to_3_years };
}

export function company(
  ticker: string,
  name: string,
  chain_position: string,
  throat_role: ThroatRole,
  sector_tags: string[],
  keywords: string[],
  why_bottleneck_or_not: WhyBottleneckOrNot,
  breakdown: Partial<CompanyBreakdown>,
): CompanySeed {
  return {
    ticker,
    name,
    chain_position,
    throat_role,
    sector_tags,
    keywords,
    why_bottleneck_or_not,
    breakdown,
  };
}
