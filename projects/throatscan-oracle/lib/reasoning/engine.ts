import { COMPANY_UNIVERSE } from "../companyUniverse";
import { enrichIntentWithRulesGrounding } from "../rulesModeGrounding";
import {
  assessUniverseCoverage,
  coverageUncertaintyMessage,
} from "../universeCoverage";
import { analyzeIntent } from "./intentAnalysis";
import { augmentIntentWithLLM } from "./generativeLLM";
import { identifyBottleneck } from "./bottleneckAnalysis";
import {
  computeConfidence,
  matchCompaniesByRole,
  resolvePrimaryTicker,
  selectCompanySeeds,
} from "./companyMatcher";
import { attachReasoningMetadata } from "./reasoningChain";
import { buildSupplyChainLayers, layersToChainNodes } from "./supplyChainBuilder";
import { buildCompanyAuditRecords } from "./auditTrail";
import { attachStructuredReport } from "./structuredReport";
import { isConstrainedLlmEnabled } from "./determinism";
import type { ReasoningResult } from "./types";
import { scoreCompaniesFromReasoning } from "../scoring";

export async function runReasoningEngine(rawInput: string): Promise<ReasoningResult> {
  let intentWithBias = analyzeIntent(rawInput);
  let inference_mode: ReasoningResult["inference_mode"] = "constrained";

  if (isConstrainedLlmEnabled()) {
    const llmIntent = await augmentIntentWithLLM(intentWithBias);
    if (llmIntent) {
      intentWithBias = { ...llmIntent, confidence: llmIntent.confidence ?? 75 };
      inference_mode = "constrained_llm";
    }
  }

  const { layer_bias, ...intent } = intentWithBias;
  const layers = buildSupplyChainLayers({ ...intent, layer_bias });
  const bottleneck = identifyBottleneck(layers);
  const { matches: company_matches, unfilled_roles } = matchCompaniesByRole(intent, bottleneck);
  const universe_coverage = assessUniverseCoverage(
    intent.raw_input,
    company_matches,
    COMPANY_UNIVERSE.length,
  );
  const selected_companies = selectCompanySeeds(company_matches);
  const chain_nodes = layersToChainNodes(layers);
  const primary_bottleneck_ticker = resolvePrimaryTicker(company_matches, selected_companies);
  const confidenceMeta = computeConfidence(company_matches, unfilled_roles, intent);
  const coverageMessage = coverageUncertaintyMessage(universe_coverage);
  if (coverageMessage) {
    confidenceMeta.uncertain_mapping = true;
    confidenceMeta.confidence_level = "LOW";
    confidenceMeta.uncertainty_message = confidenceMeta.uncertainty_message
      ? `${coverageMessage} ${confidenceMeta.uncertainty_message}`
      : coverageMessage;
  }
  if (universe_coverage.level === "out_of_scope") {
    confidenceMeta.confidence = Math.min(confidenceMeta.confidence, 35);
  }

  const groundedIntent = enrichIntentWithRulesGrounding(
    { ...intent, confidence: confidenceMeta.confidence },
    inference_mode,
  );

  const scoredCompanies = scoreCompaniesFromReasoning(
    selected_companies,
    {
      primary_layer: bottleneck.primary_layer,
      constraint_type: bottleneck.constraint_type,
      sector_signals: intent.sector_signals,
    },
    company_matches,
  );

  const final_ranking = scoredCompanies.map((company, index) => {
    const match = company_matches.find((row) => row.ticker === company.ticker);
    return {
      rank: index + 1,
      ticker: company.ticker,
      name: company.name,
      throat_score: company.score,
      confidence: Math.round((match?.match_confidence ?? 0) / 10) / 10,
      supply_role_label: match?.supply_role_label ?? "Unknown",
    };
  });

  const audit_trail = buildCompanyAuditRecords(
    company_matches,
    selected_companies,
    final_ranking.map((row) => ({ ticker: row.ticker, score: row.throat_score })),
  );

  const base = {
    intent: groundedIntent,
    layers,
    bottleneck,
    company_matches,
    selected_companies,
    chain_nodes,
    primary_bottleneck_ticker,
    inference_mode,
    universe_coverage,
    audit_trail,
    final_ranking,
    ...confidenceMeta,
  };

  const structured_report = attachStructuredReport(
    base.intent,
    base.layers,
    base.bottleneck,
    audit_trail,
    final_ranking,
  );
  const meta = attachReasoningMetadata({ ...base, structured_report });

  return { ...base, structured_report, ...meta };
}
