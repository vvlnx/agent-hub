import type { IndustryIntent, SupplyChainLayer, SupplyLayerId } from "./types";

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const LAYER_TEMPLATES: Record<
  SupplyLayerId,
  { name: (intent: IndustryIntent) => string; stage: SupplyChainLayer["stage"]; describe: (intent: IndustryIntent) => string }
> = {
  demand: {
    name: (intent) => `Demand Layer — ${intent.end_market}`,
    stage: "downstream",
    describe: (intent) =>
      `${intent.demand_driver}. Downstream adoption and deployment pace set effective industry output.`,
  },
  infrastructure: {
    name: (intent) => `Infrastructure Layer — ${intent.display_label}`,
    stage: "midstream",
    describe: (intent) =>
      `Deployment rails that translate ${intent.end_market.toLowerCase()} demand into usable capacity (network, cloud, grid, distribution).`,
  },
  core_technology: {
    name: (intent) => `Core Technology Layer — ${intent.display_label}`,
    stage: "midstream",
    describe: (intent) =>
      `Differentiated technology and platform control points that throttle how fast "${intent.display_label}" can scale.`,
  },
  materials: {
    name: (intent) => `Materials Layer — ${intent.display_label}`,
    stage: "upstream",
    describe: (intent) =>
      `Physical inputs and qualified materials feeding ${intent.end_market.toLowerCase()} — often the first hard constraint at scale.`,
  },
};

export function buildSupplyChainLayers(
  intent: IndustryIntent & { layer_bias: Partial<Record<SupplyLayerId, number>> },
): SupplyChainLayer[] {
  const bias = intent.layer_bias;
  const physical = intent.physical_intensity;
  const regulation = intent.regulation_intensity;
  const layerIds: SupplyLayerId[] = ["demand", "infrastructure", "core_technology", "materials"];

  return layerIds.map((id) => {
    const weight = bias[id] ?? 0.5;
    const constraint_score = clamp100(weight * physical * 100);
    const switching_cost_score = clamp100((weight * 0.6 + regulation * 0.4) * 100);
    const capacity_limit_score = clamp100(weight * physical * 0.85 * 100);
    const composite_pressure = clamp100(
      constraint_score * 0.4 + switching_cost_score * 0.35 + capacity_limit_score * 0.25,
    );
    const template = LAYER_TEMPLATES[id];

    return {
      id,
      name: template.name(intent),
      description: template.describe(intent),
      stage: template.stage,
      constraint_score,
      switching_cost_score,
      capacity_limit_score,
      composite_pressure,
    };
  });
}

export function layersToChainNodes(layers: SupplyChainLayer[]): import("../mockData").ChainNode[] {
  return layers.map((layer) => ({
    name: layer.name,
    description: `${layer.description} Composite pressure: ${layer.composite_pressure}/100.`,
    stage: layer.stage,
  }));
}
