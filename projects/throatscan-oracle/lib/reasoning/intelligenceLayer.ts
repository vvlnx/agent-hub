import type { Company } from "../types";
import { normalizeCompany } from "../types";
import type {
  BottleneckInsight,
  CompanyMatchReason,
  ReasoningResult,
  SupplyChainLayer,
  SupplyLayerId,
} from "./types";

export type UncertaintyTier = "HIGH" | "MEDIUM" | "LOW";

export interface UncertaintyAssessment {
  confidence: UncertaintyTier;
  reason: string;
}

export interface BottleneckTheory {
  ticker: string;
  name: string;
  layer: SupplyLayerId;
  layer_label: string;
  thesis: string;
  confidence: UncertaintyTier;
  confidence_reason: string;
}

export interface AlternativeHypothesis {
  primary_theory: BottleneckTheory;
  alternative_theory: BottleneckTheory | null;
  pivot_condition: string;
}

export interface SelfCheckItem {
  check: string;
  passed: boolean;
  finding: string;
  correction?: string;
}

export interface ContradictionTradeoff {
  signal_a: string;
  signal_b: string;
  tradeoff: string;
}

export interface ReasoningTransparencyPanel {
  confident_about: string[];
  uncertain_about: string[];
  could_change_conclusion: string[];
}

export interface CompanyUncertaintyRecord {
  ticker: string;
  name: string;
  confidence: UncertaintyTier;
  reason: string;
}

export interface ReasoningIntelligence {
  bottleneck_uncertainty: UncertaintyAssessment;
  company_uncertainties: CompanyUncertaintyRecord[];
  alternative_hypothesis: AlternativeHypothesis;
  self_checks: SelfCheckItem[];
  contradictions: ContradictionTradeoff[];
  transparency_panel: ReasoningTransparencyPanel;
}

const LAYER_LABELS: Record<SupplyLayerId, string> = {
  demand: "Demand / downstream",
  infrastructure: "Infrastructure",
  core_technology: "Core technology",
  materials: "Materials / upstream",
};

function tierFromScore(score: number): UncertaintyTier {
  if (score >= 72) return "HIGH";
  if (score >= 48) return "MEDIUM";
  return "LOW";
}

function assessCompanyUncertainty(
  company: Company,
  match: CompanyMatchReason | undefined,
  bottleneck: BottleneckInsight,
): UncertaintyAssessment {
  let score = match?.match_confidence ?? company.score * 0.6;
  const reasons: string[] = [];

  if (match) {
    if (match.sector_similarity < 30) {
      score -= 18;
      reasons.push("weak sector overlap for this query");
    }
    if (match.proxy_note) {
      score -= 15;
      reasons.push("proxy mapping — not a direct industry fit");
    }
    if (match.mapped_layer !== bottleneck.primary_layer) {
      score -= 10;
      reasons.push("role sits off the primary bottleneck layer");
    }
    if (match.role_fit < 50) {
      score -= 8;
      reasons.push("moderate role fit only");
    }
  } else {
    score -= 25;
    reasons.push("no structured match record");
  }

  if (company.breakdown.replaceability > 55) {
    score -= 12;
    reasons.push("replaceable within 1–3 years");
  }

  const confidence = tierFromScore(score);
  const reason =
    reasons.length > 0
      ? reasons.join("; ")
      : "Strong role, sector, and constraint alignment.";

  return { confidence, reason };
}

function assessBottleneckUncertainty(
  layers: SupplyChainLayer[],
  bottleneck: BottleneckInsight,
  matches: CompanyMatchReason[],
): UncertaintyAssessment {
  const ranked = [...layers].sort((a, b) => b.composite_pressure - a.composite_pressure);
  const top = ranked[0];
  const second = ranked[1];
  const gap = top && second ? top.composite_pressure - second.composite_pressure : 100;

  let score = 70 + Math.min(gap, 25);
  const reasons: string[] = [];

  if (gap < 12) {
    score -= 22;
    reasons.push(
      `layer scores nearly tied (${top?.id} vs ${second?.id}, gap ${gap})`,
    );
  }
  if (gap < 6) {
    score -= 15;
    reasons.push("bottleneck layer is ambiguous — small composite gap");
  }

  const primaryMatches = matches.filter((m) => m.mapped_layer === bottleneck.primary_layer);
  if (primaryMatches.length === 0) {
    score -= 20;
    reasons.push("no company mapped directly to primary bottleneck layer");
  }

  const avgSector =
    primaryMatches.reduce((s, m) => s + m.sector_similarity, 0) /
    Math.max(primaryMatches.length, 1);
  if (avgSector < 35) {
    score -= 12;
    reasons.push("open-domain query — sector signals are diffuse");
  }

  return {
    confidence: tierFromScore(score),
    reason:
      reasons.length > 0
        ? reasons.join("; ")
        : `Clear separation at ${LAYER_LABELS[bottleneck.primary_layer]} (${top?.composite_pressure}/100).`,
  };
}

function buildTheory(
  ticker: string,
  name: string,
  layer: SupplyLayerId,
  thesis: string,
  confidence: UncertaintyTier,
  confidence_reason: string,
): BottleneckTheory {
  return {
    ticker,
    name,
    layer,
    layer_label: LAYER_LABELS[layer],
    thesis,
    confidence,
    confidence_reason,
  };
}

function findAlternativeCandidate(
  matches: CompanyMatchReason[],
  layer: SupplyLayerId,
  excludeTicker: string,
): CompanyMatchReason | undefined {
  return matches
    .filter((m) => m.ticker !== excludeTicker && m.mapped_layer === layer)
    .sort((a, b) => b.composite - a.composite || a.ticker.localeCompare(b.ticker))[0];
}

function buildAlternativeHypothesis(
  reasoning: ReasoningResult,
  companies: Company[],
  primaryCompany: Company,
): AlternativeHypothesis {
  const rankedLayers = [...reasoning.layers].sort(
    (a, b) => b.composite_pressure - a.composite_pressure,
  );
  const primaryLayer = reasoning.bottleneck.primary_layer;
  const altLayer = rankedLayers.find((l) => l.id !== primaryLayer)?.id ?? "materials";
  const altLayerData = rankedLayers.find((l) => l.id === altLayer)!;
  const gap =
    rankedLayers[0].composite_pressure - (rankedLayers[1]?.composite_pressure ?? 0);

  const primaryMatch = reasoning.company_matches.find(
    (m) => m.ticker === primaryCompany.ticker,
  );
  const primaryThesis =
    primaryMatch?.why_selected.split(".")[0] ??
    `${primaryCompany.ticker} controls the ${LAYER_LABELS[primaryLayer]} choke point.`;

  const primaryTheory = buildTheory(
    primaryCompany.ticker,
    primaryCompany.name,
    primaryLayer,
    primaryThesis,
    assessBottleneckUncertainty(reasoning.layers, reasoning.bottleneck, reasoning.company_matches)
      .confidence,
    gap >= 12
      ? `Primary layer leads by ${gap} composite points.`
      : `Leading theory, but layer gap is only ${gap} points.`,
  );

  const altMatch =
    findAlternativeCandidate(reasoning.company_matches, altLayer, primaryCompany.ticker) ??
    reasoning.company_matches.find((m) => m.mapped_layer === altLayer);

  if (!altMatch || gap > 20) {
    return {
      primary_theory: primaryTheory,
      alternative_theory: null,
      pivot_condition: "No credible alternative at current constraint focus.",
    };
  }

  const altSeed = companies.find((c) => c.ticker === altMatch.ticker);
  const constraintPivot =
    reasoning.bottleneck.constraint_type === "supply"
      ? "If supply/material qualification becomes the binding constraint"
      : reasoning.bottleneck.constraint_type === "switching"
        ? "If switching-cost / platform lock-in dominates over capacity"
        : "If deployment capacity — not technology allocation — caps output";

  const altThesis = `${altMatch.ticker} as ${altMatch.supply_role_label}: ${altMatch.why_selected.split(".")[0]}.`;

  return {
    primary_theory: primaryTheory,
    alternative_theory: buildTheory(
      altMatch.ticker,
      altSeed?.name ?? altMatch.ticker,
      altLayer,
      altThesis,
      assessCompanyUncertainty(
        altSeed ? normalizeCompany(altSeed) : normalizeCompany({ ticker: altMatch.ticker, name: altMatch.ticker }),
        altMatch,
        reasoning.bottleneck,
      ).confidence,
      `Alternative if ${LAYER_LABELS[altLayer]} pressure (${altLayerData.composite_pressure}/100) overtakes current focus.`,
    ),
    pivot_condition: constraintPivot,
  };
}

function runSelfChecks(
  reasoning: ReasoningResult,
  companies: Company[],
  primaryTicker: string,
): SelfCheckItem[] {
  const ranked = companies.slice(0, 5);
  const downstreamRoles = ["downstream_consumer", "platform_controller"];
  const downstreamCount = ranked.filter((c) =>
    downstreamRoles.includes(c.selection_insight?.supply_role ?? ""),
  ).length;
  const downstreamRatio = downstreamCount / Math.max(ranked.length, 1);

  const materialsLayer = reasoning.layers.find((l) => l.id === "materials");
  const primaryLayer = reasoning.layers.find(
    (l) => l.id === reasoning.bottleneck.primary_layer,
  );
  const materialsGap =
    (materialsLayer?.composite_pressure ?? 0) -
    (primaryLayer?.composite_pressure ?? 0);
  const hasUpstreamPick = ranked.some((c) =>
    ["material_bottleneck", "equipment_supplier", "compute_provider"].includes(
      c.selection_insight?.supply_role ?? "",
    ),
  );

  const primary = ranked.find((c) => c.ticker === primaryTicker) ?? ranked[0];
  const structuralScore =
    (primary?.breakdown.bottleneck_strength ?? 0) * 0.5 +
    (100 - (primary?.breakdown.replaceability ?? 50)) * 0.3 +
    (primary?.breakdown.supply_chain_control ?? 0) * 0.2;
  const structuralPass = structuralScore >= 55;

  return [
    {
      check: "Did we over-select downstream companies?",
      passed: downstreamRatio <= 0.4,
      finding:
        downstreamRatio > 0.4
          ? `${downstreamCount}/${ranked.length} picks are downstream-facing — possible narrative bias.`
          : `${downstreamCount}/${ranked.length} downstream picks — within acceptable range.`,
      correction:
        downstreamRatio > 0.4
          ? "Re-weight toward upstream material/equipment roles if physical supply is binding."
          : undefined,
    },
    {
      check: "Did we miss upstream constraints?",
      passed: hasUpstreamPick || materialsGap < -15,
      finding:
        !hasUpstreamPick && materialsGap >= -12
          ? `Materials layer pressure (${materialsLayer?.composite_pressure}/100) is competitive but under-represented in picks.`
          : hasUpstreamPick
            ? "Upstream/equipment/compute roles are represented in the candidate set."
            : "Primary bottleneck is downstream — upstream omission is consistent with layer ranking.",
      correction:
        !hasUpstreamPick && materialsGap >= -12
          ? "Consider elevating material or equipment suppliers if supply qualification is the real cap."
          : undefined,
    },
    {
      check: "Is bottleneck truly structural?",
      passed: structuralPass,
      finding: structuralPass
        ? `${primary?.ticker} shows structural control (strength ${primary?.breakdown.bottleneck_strength}, replaceability ${primary?.breakdown.replaceability}).`
        : `${primary?.ticker} may be a demand proxy — lower structural control (score ${Math.round(structuralScore)}).`,
      correction: structuralPass
        ? undefined
        : "Treat as conditional bottleneck — validate against upstream capacity before STRONG FOCUS.",
    },
  ];
}

function detectContradictions(
  reasoning: ReasoningResult,
  companies: Company[],
): ContradictionTradeoff[] {
  const tradeoffs: ContradictionTradeoff[] = [];
  const ranked = [...reasoning.layers].sort(
    (a, b) => b.composite_pressure - a.composite_pressure,
  );

  if (ranked.length >= 2) {
    const gap = ranked[0].composite_pressure - ranked[1].composite_pressure;
    if (gap < 12) {
      tradeoffs.push({
        signal_a: `${LAYER_LABELS[ranked[0].id]} leads (${ranked[0].composite_pressure}/100)`,
        signal_b: `${LAYER_LABELS[ranked[1].id]} close behind (${ranked[1].composite_pressure}/100)`,
        tradeoff: `Bottleneck could shift to ${ranked[1].id} if constraint focus changes — not a single fixed choke point.`,
      });
    }
  }

  for (const company of companies.slice(0, 5)) {
    const match = reasoning.company_matches.find((m) => m.ticker === company.ticker);
    if (!match) continue;

    if (
      company.throat_role === "CORE BOTTLENECK" &&
      (match.supply_role === "downstream_consumer" ||
        match.supply_role === "platform_controller")
    ) {
      tradeoffs.push({
        signal_a: `${company.ticker} tagged CORE BOTTLENECK`,
        signal_b: `Mapped as ${match.supply_role_label} (downstream/platform)`,
        tradeoff:
          "Role conflict — high throat score may reflect narrative exposure, not upstream control.",
      });
    }

    if (match.sector_similarity < 28 && match.composite >= 55) {
      tradeoffs.push({
        signal_a: `${company.ticker} strong composite match (${match.composite})`,
        signal_b: `Low sector overlap (${match.sector_similarity}/100)`,
        tradeoff:
          "Open-domain proxy — useful structural analog, not a confirmed industry pure-play.",
      });
    }
  }

  if (
    reasoning.bottleneck.constraint_type === "supply" &&
    reasoning.bottleneck.primary_layer === "core_technology"
  ) {
    tradeoffs.push({
      signal_a: "Constraint typed as supply-limited",
      signal_b: "Bottleneck layer is core technology (not materials)",
      tradeoff:
        "Supply stress may sit upstream (fab/materials) even while technology layer scores highest.",
    });
  }

  return tradeoffs.slice(0, 4);
}

function buildTransparencyPanel(
  reasoning: ReasoningResult,
  bottleneckUncertainty: UncertaintyAssessment,
  selfChecks: SelfCheckItem[],
  contradictions: ContradictionTradeoff[],
  alternative: AlternativeHypothesis,
  companyUncertainties: CompanyUncertaintyRecord[],
): ReasoningTransparencyPanel {
  const confident_about: string[] = [
    `Demand driver: ${reasoning.intent.demand_driver}`,
    `Primary layer ranking: ${LAYER_LABELS[reasoning.bottleneck.primary_layer]} (${reasoning.bottleneck.constraint_type} constraint).`,
  ];

  if (bottleneckUncertainty.confidence === "HIGH") {
    confident_about.push(bottleneckUncertainty.reason);
  }

  const passedChecks = selfChecks.filter((c) => c.passed);
  for (const check of passedChecks.slice(0, 2)) {
    confident_about.push(check.finding);
  }

  const uncertain_about: string[] = [];
  if (bottleneckUncertainty.confidence !== "HIGH") {
    uncertain_about.push(`Bottleneck layer: ${bottleneckUncertainty.reason}`);
  }

  const lowConfCompanies = companyUncertainties.filter((c) => c.confidence === "LOW");
  for (const c of lowConfCompanies.slice(0, 2)) {
    uncertain_about.push(`${c.ticker}: ${c.reason}`);
  }

  for (const c of contradictions.slice(0, 2)) {
    uncertain_about.push(c.tradeoff);
  }

  const could_change_conclusion: string[] = [];
  if (alternative.alternative_theory) {
    could_change_conclusion.push(
      `${alternative.pivot_condition} → alternative choke point: ${alternative.alternative_theory.ticker} (${alternative.alternative_theory.layer_label}).`,
    );
  }

  for (const check of selfChecks.filter((c) => !c.passed && c.correction)) {
    could_change_conclusion.push(check.correction!);
  }

  if (reasoning.uncertain_mapping) {
    could_change_conclusion.push(
      reasoning.uncertainty_message ??
        "Higher-confidence sector data could replace proxy mappings.",
    );
  }

  if (could_change_conclusion.length === 0) {
    could_change_conclusion.push(
      "Sharper industry definition or updated capacity data could refine ranking order, not necessarily the primary thesis.",
    );
  }

  return {
    confident_about: confident_about.slice(0, 4),
    uncertain_about: uncertain_about.slice(0, 4),
    could_change_conclusion: could_change_conclusion.slice(0, 3),
  };
}

export function buildReasoningIntelligence(
  reasoning: ReasoningResult,
  companies: Company[],
): ReasoningIntelligence {
  const normalized = companies.map((c) => normalizeCompany(c));
  const primary =
    normalized.find((c) => c.ticker === reasoning.primary_bottleneck_ticker) ?? normalized[0];

  const bottleneck_uncertainty = assessBottleneckUncertainty(
    reasoning.layers,
    reasoning.bottleneck,
    reasoning.company_matches,
  );

  const company_uncertainties = normalized.slice(0, 8).map((company) => {
    const match = reasoning.company_matches.find((m) => m.ticker === company.ticker);
    const assessment = assessCompanyUncertainty(company, match, reasoning.bottleneck);
    return {
      ticker: company.ticker,
      name: company.name,
      confidence: assessment.confidence,
      reason: assessment.reason,
    };
  });

  const alternative_hypothesis = buildAlternativeHypothesis(reasoning, normalized, primary);
  const self_checks = runSelfChecks(reasoning, normalized, primary.ticker);
  const contradictions = detectContradictions(reasoning, normalized);
  const transparency_panel = buildTransparencyPanel(
    reasoning,
    bottleneck_uncertainty,
    self_checks,
    contradictions,
    alternative_hypothesis,
    company_uncertainties,
  );

  return {
    bottleneck_uncertainty,
    company_uncertainties,
    alternative_hypothesis,
    self_checks,
    contradictions,
    transparency_panel,
  };
}

export function uncertaintyTierStyles(tier: UncertaintyTier): string {
  if (tier === "HIGH") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (tier === "MEDIUM") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
}
