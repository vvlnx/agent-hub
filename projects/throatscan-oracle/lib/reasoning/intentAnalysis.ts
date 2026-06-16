import { normalizeIndustryQuery, tokenizeIndustry } from "../industryAliases";
import type { IndustryIntent, SupplyLayerId } from "./types";

const LAYER_CONCEPTS: Record<SupplyLayerId, string[]> = {
  demand: [
    "demand",
    "consumer",
    "oem",
    "vehicle",
    "automotive",
    "pharma",
    "clinical",
    "deployment",
    "integrator",
    "robotics",
    "utility",
    "exchange",
  ],
  infrastructure: [
    "cloud",
    "data",
    "center",
    "network",
    "hyperscale",
    "platform",
    "power",
    "cooling",
    "grid",
    "payment",
    "fintech",
    "saas",
  ],
  core_technology: [
    "chip",
    "semiconductor",
    "gpu",
    "ai",
    "compute",
    "software",
    "platform",
    "accelerator",
    "foundry",
    "robot",
    "defense",
    "biotech",
  ],
  materials: [
    "lithium",
    "battery",
    "uranium",
    "oil",
    "gas",
    "material",
    "chemical",
    "wafer",
    "fuel",
    "refining",
    "cathode",
    "hydrocarbon",
  ],
};

const PHYSICAL_HINTS =
  /battery|lithium|wafer|oil|gas|uranium|vehicle|fab|chip|semiconductor|refining|hydrocarbon|nuclear|material|cathode/i;
const REGULATED_HINTS =
  /pharma|biotech|healthcare|defense|nuclear|fintech|payment|clinical|regulated|compliance/i;
const DIGITAL_HINTS = /cloud|saas|software|ai|data center|platform|fintech|payment|llm/i;

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function tokenHitsConcepts(tokens: string[], concepts: string[]): number {
  let hits = 0;
  for (const token of tokens) {
    if (concepts.some((concept) => concept.includes(token) || token.includes(concept))) {
      hits += 1;
    }
  }
  return hits;
}

function inferLayerBias(
  normalized: string,
  tokens: string[],
): Partial<Record<SupplyLayerId, number>> {
  const scores: Record<SupplyLayerId, number> = {
    demand: 0.35,
    infrastructure: 0.35,
    core_technology: 0.35,
    materials: 0.35,
  };

  for (const layer of Object.keys(LAYER_CONCEPTS) as SupplyLayerId[]) {
    const conceptHits = tokenHitsConcepts(tokens, LAYER_CONCEPTS[layer]);
    const textHits = LAYER_CONCEPTS[layer].filter((concept) => normalized.includes(concept)).length;
    scores[layer] += conceptHits * 0.12 + textHits * 0.18;
  }

  const max = Math.max(...Object.values(scores));
  const bias: Partial<Record<SupplyLayerId, number>> = {};
  for (const layer of Object.keys(scores) as SupplyLayerId[]) {
    bias[layer] = Math.max(0.35, Math.min(1, scores[layer] / max));
  }
  return bias;
}

function generateSectorSignals(tokens: string[], normalized: string): string[] {
  const signals = new Set<string>();

  for (const token of tokens.slice(0, 6)) {
    if (token.length > 2) signals.add(titleCase(token));
  }

  if (PHYSICAL_HINTS.test(normalized)) signals.add("Physical Supply Chain");
  if (DIGITAL_HINTS.test(normalized)) signals.add("Digital Infrastructure");
  if (REGULATED_HINTS.test(normalized)) signals.add("Regulated Workflow");

  return signals.size > 0 ? [...signals].slice(0, 5) : ["Open-domain Industry"];
}

function generateDemandDriver(tokens: string[], normalized: string, label: string): string {
  if (PHYSICAL_HINTS.test(normalized)) {
    return `Physical throughput and qualified-input scale for ${label}`;
  }
  if (DIGITAL_HINTS.test(normalized)) {
    return `Digital workload growth and platform deployment for ${label}`;
  }
  if (REGULATED_HINTS.test(normalized)) {
    return `Regulated commercialization and compliance-limited scale for ${label}`;
  }
  if (tokens.length > 0) {
    return `End-market pull driven by ${tokens.slice(0, 3).join(", ")} demand`;
  }
  return `General industrial demand scaling for ${label}`;
}

function generateEndMarket(tokens: string[], normalized: string, label: string): string {
  if (tokens.length >= 2) {
    return `${titleCase(tokens.slice(0, 2).join(" "))} value chain`;
  }
  if (/[\u4e00-\u9fff]/.test(label)) {
    return `${label} 相关产业链`;
  }
  return `${label} open-domain supply chain`;
}

export function analyzeIntent(
  rawInput: string,
): IndustryIntent & { layer_bias: Partial<Record<SupplyLayerId, number>> } {
  const raw = rawInput.trim() || "General Industry";
  const normalized_query = normalizeIndustryQuery(raw);
  const normalized = normalized_query.toLowerCase();
  const tokens = tokenizeIndustry(raw);
  const display_label = /[\u4e00-\u9fff]/.test(raw) ? raw : titleCase(normalized_query);

  const physical_intensity = PHYSICAL_HINTS.test(normalized)
    ? 0.9
    : DIGITAL_HINTS.test(normalized)
      ? 0.35
      : 0.55;
  const regulation_intensity = REGULATED_HINTS.test(normalized) ? 0.88 : 0.45;

  return {
    raw_input: raw,
    normalized_query,
    display_label,
    demand_driver: generateDemandDriver(tokens, normalized, display_label),
    end_market: generateEndMarket(tokens, normalized, display_label),
    sector_signals: generateSectorSignals(tokens, normalized),
    physical_intensity,
    regulation_intensity,
    layer_bias: inferLayerBias(normalized, tokens),
  };
}
