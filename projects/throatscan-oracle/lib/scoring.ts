import {
  clampScore,
  normalizeBreakdown,
  normalizeCompany,
  normalizeWhy,
  type Company,
  type CompanyBreakdown,
} from "./types";
import type { CompanySeed, IndustryId } from "./mockData";

const THROAT_SCORE_WEIGHTS = {
  bottleneck_strength: 0.4,
  supply_chain_control: 0.25,
  industry_dependency: 0.2,
  replacement_resistance: 0.15,
} as const;

function computeThroatScore(breakdown: CompanyBreakdown): number {
  const replacementResistance = 100 - breakdown.replaceability;

  return (
    breakdown.bottleneck_strength * THROAT_SCORE_WEIGHTS.bottleneck_strength +
    breakdown.supply_chain_control * THROAT_SCORE_WEIGHTS.supply_chain_control +
    breakdown.industry_dependency * THROAT_SCORE_WEIGHTS.industry_dependency +
    replacementResistance * THROAT_SCORE_WEIGHTS.replacement_resistance
  );
}

export function scoreCompany(seed: CompanySeed, _industryId: IndustryId): Company {
  const breakdown = normalizeBreakdown(seed.breakdown);
  const score = clampScore(computeThroatScore(breakdown));

  return normalizeCompany({
    name: seed.name,
    ticker: seed.ticker,
    score,
    breakdown,
    throat_role: seed.throat_role,
    chain_position: seed.chain_position,
    why_bottleneck_or_not: normalizeWhy(seed.why_bottleneck_or_not),
  });
}

export function scoreCompanies(seeds: CompanySeed[], industryId: IndustryId): Company[] {
  return seeds
    .map((seed) => scoreCompany(seed, industryId))
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));
}
