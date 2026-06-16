import type {
  BottleneckInsight,
  CompanyMatchReason,
  IndustryIntent,
  ReasoningResult,
  SupplyChainLayer,
} from "./types";

export function buildReasoningChain(
  intent: IndustryIntent,
  layers: SupplyChainLayer[],
  bottleneck: BottleneckInsight,
  matches: CompanyMatchReason[],
  uncertain_mapping: boolean,
  uncertainty_message?: string,
  run_id?: string,
): string[] {
  const primaryLayer = layers.find((layer) => layer.id === bottleneck.primary_layer);
  const roleSummary = matches
    .slice(0, 5)
    .map((match) => `${match.ticker} (${match.supply_role_label})`)
    .join(", ");

  const steps = [
    `A — Industry interpretation: "${intent.display_label}" | demand: ${intent.demand_driver} | end market: ${intent.end_market} | signals: ${intent.sector_signals.join(", ")}${run_id ? ` | run: ${run_id}` : ""}.`,
    `B — Supply chain layers (fixed schema): ${layers.map((layer) => `${layer.id}=${layer.composite_pressure}`).join(", ")}.`,
    `C — Bottleneck identification: ${primaryLayer?.name ?? bottleneck.primary_layer} (${primaryLayer?.composite_pressure ?? "?"}/100) — ${bottleneck.rationale}`,
    `D — Company candidates (role + constraint gate): ${roleSummary || "none"} — each must satisfy ≥1 hard constraint.`,
    `E — Final ranking: ${matches.slice(0, 5).map((match, index) => `#${index + 1} ${match.ticker} (${match.match_confidence}/100 conf)`).join(", ") || "withheld"}.`,
  ];

  if (uncertain_mapping && uncertainty_message) {
    steps.push(`Uncertainty flag: ${uncertainty_message}`);
  }

  return steps;
}

export function buildSummary(
  intent: IndustryIntent,
  bottleneck: BottleneckInsight,
  confidence: number,
  confidence_level: ReasoningResult["confidence_level"],
  uncertain_mapping: boolean,
): string {
  const prefix = uncertain_mapping
    ? `Constrained generative ThroatScan [${confidence_level}] (${confidence}/100)`
    : `Constrained generative ThroatScan [${confidence_level}] (${confidence}/100)`;
  return `${prefix} for "${intent.display_label}": ${intent.demand_driver}. Primary choke point at ${bottleneck.location_description}.`;
}

export function buildSelectionRationale(
  intent: IndustryIntent,
  matches: CompanyMatchReason[],
  uncertain_mapping: boolean,
): string {
  if (matches.length === 0) {
    return `No companies passed constrained selection for "${intent.display_label}".`;
  }

  const parts = matches.slice(0, 3).map((match) => {
    const constraints = match.constraints_met.length > 0 ? match.constraints_met.join("+") : "none";
    return `${match.ticker} as ${match.supply_role_label} [${constraints}] — ${match.why_selected}`;
  });

  const suffix = uncertain_mapping
    ? " LOW CONFIDENCE — partial list only; do not treat as full Top 5."
    : "";

  return `Constrained role-based selection for ${intent.end_market}: ${parts.join(" ")}${suffix}`;
}

export function attachReasoningMetadata(
  result: Omit<
    ReasoningResult,
    "reasoning_chain" | "summary" | "selection_rationale"
  >,
): Pick<ReasoningResult, "reasoning_chain" | "summary" | "selection_rationale"> {
  const reasoning_chain = buildReasoningChain(
    result.intent,
    result.layers,
    result.bottleneck,
    result.company_matches,
    result.uncertain_mapping,
    result.uncertainty_message,
    result.structured_report.run_id,
  );

  return {
    reasoning_chain,
    summary: buildSummary(
      result.intent,
      result.bottleneck,
      result.confidence,
      result.confidence_level,
      result.uncertain_mapping,
    ),
    selection_rationale: buildSelectionRationale(
      result.intent,
      result.company_matches,
      result.uncertain_mapping,
    ),
  };
}
