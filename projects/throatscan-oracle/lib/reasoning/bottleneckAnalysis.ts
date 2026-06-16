import type { BottleneckInsight, ConstraintType, SupplyChainLayer, SupplyLayerId } from "./types";

const LAYER_ROLE_HINTS: Record<SupplyLayerId, string> = {
  materials: "qualified material supply and refining capacity",
  core_technology: "platform or technology allocation with high switching friction",
  infrastructure: "deployment infrastructure with limited near-term capacity",
  demand: "downstream integrator scale and installed-base lock-in",
};

export function identifyBottleneck(layers: SupplyChainLayer[]): BottleneckInsight {
  const ranked = [...layers].sort((a, b) => b.composite_pressure - a.composite_pressure);
  const primary = ranked[0];

  const scores: Array<{ type: ConstraintType; value: number }> = [
    { type: "supply", value: primary.constraint_score },
    { type: "switching", value: primary.switching_cost_score },
    { type: "capacity", value: primary.capacity_limit_score },
  ];
  scores.sort((a, b) => b.value - a.value);
  const constraint_type = scores[0].type;

  const constraintLabel =
    constraint_type === "supply"
      ? "supply is constrained"
      : constraint_type === "switching"
        ? "switching costs are highest"
        : "production/deployment capacity is limited";

  return {
    primary_layer: primary.id,
    constraint_type,
    location_description: `${primary.name} — ${LAYER_ROLE_HINTS[primary.id]}`,
    rationale: `Highest composite pressure at ${primary.name} (${primary.composite_pressure}/100): ${constraintLabel}.`,
  };
}
