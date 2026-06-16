import {
  clampScore,
  normalizeBreakdown,
  normalizeCompany,
  normalizeWhy,
  type Company,
  type CompanyBreakdown,
} from "./types";
import type { CompanySeed } from "./mockData";
import type { ReasoningScoreContext } from "./reasoning/types";

function computeBaseThroatScore(breakdown: CompanyBreakdown): number {
  const replacementResistance = 100 - breakdown.replaceability;
  return (
    breakdown.bottleneck_strength * 0.4 +
    breakdown.supply_chain_control * 0.25 +
    breakdown.industry_dependency * 0.2 +
    replacementResistance * 0.15
  );
}

function computeReasoningScore(breakdown: CompanyBreakdown, context: ReasoningScoreContext): number {
  const match = context.company_match;
  const base = computeBaseThroatScore(breakdown);

  if (!match) {
    return base * 0.85;
  }

  const layerCriticality = match.mapped_layer === context.primary_layer ? 12 : 0;
  const constraintBoost =
    context.constraint_type === "supply"
      ? match.sector_similarity * 0.08
      : context.constraint_type === "switching"
        ? match.substitution_difficulty * 0.1
        : match.role_fit * 0.08;

  const reasoningBlend =
    match.sector_similarity * 0.22 +
    match.role_fit * 0.2 +
    match.dependency_exposure * 0.18 +
    match.substitution_difficulty * 0.12;

  return base * 0.45 + reasoningBlend * 0.55 + layerCriticality + constraintBoost;
}

export function scoreCompany(seed: CompanySeed, context: ReasoningScoreContext): Company {
  const breakdown = normalizeBreakdown(seed.breakdown);
  const score = clampScore(computeReasoningScore(breakdown, context));

  return normalizeCompany({
    name: seed.name,
    ticker: seed.ticker,
    sector_tags: seed.sector_tags,
    score,
    breakdown,
    throat_role: seed.throat_role,
    chain_position: seed.chain_position,
    why_bottleneck_or_not: normalizeWhy(seed.why_bottleneck_or_not),
    selection_insight: context.company_match
      ? {
          supply_role: context.company_match.supply_role,
          supply_role_label: context.company_match.supply_role_label,
          why_selected: context.company_match.why_selected,
          why_not_others: context.company_match.why_not_others,
          depends_on: context.company_match.depends_on,
          match_confidence: Math.round(context.company_match.match_confidence) / 100,
          constraints_met: context.company_match.constraints_met.map(
            (constraint) => constraint.replace(/_/g, " "),
          ),
        }
      : undefined,
  });
}

export function scoreCompaniesFromReasoning(
  seeds: CompanySeed[],
  contextBase: Omit<ReasoningScoreContext, "company_match">,
  matches: import("./reasoning/types").CompanyMatchReason[],
): Company[] {
  const matchByTicker = new Map(
    (matches ?? []).map((match) => [match!.ticker, match!]),
  );

  return seeds
    .map((seed) =>
      scoreCompany(seed, {
        ...contextBase,
        company_match: matchByTicker.get(seed.ticker),
      }),
    )
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));
}

/** @deprecated use scoreCompaniesFromReasoning */
export function scoreCompanies(
  seeds: CompanySeed[],
  scoreBoosts?: Record<string, number>,
): Company[] {
  void scoreBoosts;
  return scoreCompaniesFromReasoning(
    seeds,
    {
      primary_layer: "core_technology",
      constraint_type: "supply",
      sector_signals: [],
    },
    [],
  );
}
