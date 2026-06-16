import { runReasoningEngine } from "./reasoning/engine";
import type {
  ChainNode,
  CompanySeed,
  IndustryInterpretation,
  IndustryProfile,
  SupplyChainArchetype,
} from "./mockData";
import type { ReasoningResult } from "./reasoning/types";

function layerToArchetype(layer: ReasoningResult["bottleneck"]["primary_layer"]): SupplyChainArchetype {
  const map: Record<string, SupplyChainArchetype> = {
    materials: "energy_materials",
    core_technology: "compute_hardware",
    infrastructure: "ai_infrastructure",
    demand: "platform_software",
  };
  return map[layer] ?? "general";
}

function reasoningToInterpretation(result: ReasoningResult): IndustryInterpretation {
  return {
    user_input: result.intent.raw_input,
    display_label: result.intent.display_label,
    sector_tags: result.intent.sector_signals,
    archetype: layerToArchetype(result.bottleneck.primary_layer),
    primary_bottleneck_ticker: result.primary_bottleneck_ticker,
    bottleneck_hint: result.bottleneck.location_description,
    inference_mode: result.inference_mode,
    demand_driver: result.intent.demand_driver,
    end_market: result.intent.end_market,
    selection_rationale: result.selection_rationale,
    confidence: result.confidence,
  };
}

function adaptCompaniesForIndustry(
  companies: CompanySeed[],
  label: string,
  sectorTags: string[],
): CompanySeed[] {
  return companies.map((company) => ({
    ...company,
    chain_position: `${company.chain_position} → ${label}`,
    why_bottleneck_or_not: {
      ...company.why_bottleneck_or_not,
      scarce_resource: `${company.why_bottleneck_or_not.scarce_resource} Mapped via reasoning to ${label}.`,
      can_function_without: `${company.why_bottleneck_or_not.can_function_without} Context: ${sectorTags.join(" + ")}.`,
    },
  }));
}

export async function buildIndustryProfile(input: string): Promise<IndustryProfile> {
  const reasoning = await runReasoningEngine(input);
  const interpretation = reasoningToInterpretation(reasoning);
  const companies = adaptCompaniesForIndustry(
    reasoning.selected_companies,
    reasoning.intent.display_label,
    reasoning.intent.sector_signals,
  );

  const bottleneckCompany = companies.find(
    (company) => company.ticker === reasoning.primary_bottleneck_ticker,
  );

  return {
    label: reasoning.intent.display_label,
    interpretation,
    summary: reasoning.summary,
    selection_rationale: reasoning.selection_rationale,
    reasoning_chain: reasoning.reasoning_chain,
    bottleneck_location: bottleneckCompany
      ? `${bottleneckCompany.chain_position.split(" →")[0]} — ${reasoning.bottleneck.rationale}`
      : reasoning.bottleneck.location_description,
    primary_bottleneck_ticker: reasoning.primary_bottleneck_ticker,
    chain: reasoning.chain_nodes as ChainNode[],
    companies,
    reasoning,
  };
}

export async function inferWithLLM(input: string): Promise<IndustryInterpretation> {
  const profile = await buildIndustryProfile(input);
  return profile.interpretation;
}

export function interpretIndustry(input: string): IndustryInterpretation {
  void input;
  throw new Error("Use buildIndustryProfile() — synchronous interpretIndustry is deprecated.");
}
