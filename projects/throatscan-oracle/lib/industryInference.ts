import { runReasoningEngine } from "./reasoning/engine";
import { resolveGicsFromQueryAsync, type ResolvedGicsQuery } from "./gics";
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

function reasoningToInterpretation(
  result: ReasoningResult,
  gics: ResolvedGicsQuery,
): IndustryInterpretation {
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
    research_sources: result.intent.research_sources,
    research_queries: result.intent.research_queries,
    web_search_used: result.intent.web_search_used,
    grounding_mode: result.intent.grounding_mode,
    gics,
  };
}

function adaptCompaniesForIndustry(
  companies: CompanySeed[],
  label: string,
  coverageLevel: import("./universeCoverage").UniverseCoverageLevel,
): CompanySeed[] {
  if (coverageLevel === "out_of_scope") {
    return companies;
  }

  const suffix = coverageLevel === "partial" ? ` (proxy for ${label})` : ` → ${label}`;

  return companies.map((company) => ({
    ...company,
    chain_position:
      coverageLevel === "full"
        ? `${company.chain_position} → ${label}`
        : `${company.chain_position}${suffix}`,
    why_bottleneck_or_not:
      coverageLevel === "full"
        ? {
            ...company.why_bottleneck_or_not,
            scarce_resource: `${company.why_bottleneck_or_not.scarce_resource} Applied to ${label} via constrained sector alignment.`,
            can_function_without: company.why_bottleneck_or_not.can_function_without,
          }
        : company.why_bottleneck_or_not,
  }));
}

export async function buildIndustryProfile(input: string): Promise<IndustryProfile> {
  const reasoning = await runReasoningEngine(input);
  const gics = await resolveGicsFromQueryAsync(reasoning.intent.raw_input);
  const interpretation = reasoningToInterpretation(reasoning, gics);
  const companies = adaptCompaniesForIndustry(
    reasoning.selected_companies,
    reasoning.intent.display_label,
    reasoning.universe_coverage.level,
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
