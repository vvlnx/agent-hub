import { buildIndustryProfile } from "./industryInference";
import { isLLMConfigured } from "./llm/config";
import { normalizeAnalysisCompanies, type AnalysisResult } from "./mockData";
import { runBacktestValidation } from "./backtest";
import { buildThroatScanConclusion } from "./conclusion";
import { buildFinalDecisionLayer } from "./decisionLayer";
import { buildReasoningIntelligence } from "./reasoning/intelligenceLayer";
import { scoreCompaniesFromReasoning } from "./scoring";
import { attachBitgetEquityEvidence } from "./bitgetStocks";
import { discoverBitgetListedCandidates } from "./equity";
import { enrichCompaniesWithGics } from "./gics/enrich";
import { discoverBitgetCandidatesByGicsPrefix, mergeDiscoveryResults } from "./gics";
import { fetchMarketResearch } from "./marketResearch";
import { buildEventIntelligence } from "./eventIntelligence";
import { buildIndustryMap } from "./industryMap";
import { buildCompletenessPack } from "./completeness/buildCompletenessPack";
import { buildThesisAudit } from "./thesisAudit";

const MOCK_DELAY_MS = 300;

export type AnalysisPhaseId =
  | "reasoning"
  | "bitget_research"
  | "events"
  | "backtest"
  | "discovery"
  | "completeness";

export interface AnalysisProgressEvent {
  phase: AnalysisPhaseId;
  label_en: string;
  label_zh: string;
  progress_pct: number;
}

const PHASE_LABELS: Record<
  AnalysisPhaseId,
  Pick<AnalysisProgressEvent, "label_en" | "label_zh" | "progress_pct">
> = {
  reasoning: {
    label_en: "Supply-chain reasoning and GICS enrichment",
    label_zh: "供应链推理与 GICS 行业映射",
    progress_pct: 15,
  },
  bitget_research: {
    label_en: "Bitget tradability + Agent Hub news/macro",
    label_zh: "Bitget 可交易性 + Agent Hub 新闻/宏观",
    progress_pct: 35,
  },
  events: {
    label_en: "Event intelligence and decision layer",
    label_zh: "事件情报与决策层",
    progress_pct: 50,
  },
  backtest: {
    label_en: "Bitget candle backtest and industry map",
    label_zh: "Bitget K 线回测与行业地图",
    progress_pct: 70,
  },
  discovery: {
    label_en: "Bitget peer discovery (sector + GICS)",
    label_zh: "Bitget 同业发现（行业关键词 + GICS）",
    progress_pct: 85,
  },
  completeness: {
    label_en: "Completeness pack and audit trail",
    label_zh: "完整性包与审计链",
    progress_pct: 95,
  },
};

function emitPhase(
  onProgress: ((event: AnalysisProgressEvent) => void) | undefined,
  phase: AnalysisPhaseId,
): void {
  if (!onProgress) return;
  onProgress({ phase, ...PHASE_LABELS[phase] });
}

export async function runAnalyzePipeline(
  industry: string,
  onProgress?: (event: AnalysisProgressEvent) => void,
): Promise<AnalysisResult> {
  if (!isLLMConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  }

  emitPhase(onProgress, "reasoning");
  const profile = await buildIndustryProfile(industry);
  const reasoning = profile.reasoning;

  const companies = normalizeAnalysisCompanies(
    scoreCompaniesFromReasoning(
      profile.companies,
      {
        primary_layer: reasoning.bottleneck.primary_layer,
        constraint_type: reasoning.bottleneck.constraint_type,
        sector_signals: reasoning.intent.sector_signals,
      },
      reasoning.company_matches,
    ),
  );
  const companiesWithGics = await enrichCompaniesWithGics(companies);

  const reasoning_intelligence = buildReasoningIntelligence(reasoning, companiesWithGics);
  const companiesWithUncertainty = companiesWithGics.map((company) => {
    const record = reasoning_intelligence.company_uncertainties.find(
      (row) => row.ticker === company.ticker,
    );
    if (!record?.confidence || !company.selection_insight) {
      return company;
    }
    return {
      ...company,
      selection_insight: {
        ...company.selection_insight,
        uncertainty_confidence: record.confidence,
        uncertainty_reason: record.reason,
      },
    };
  });

  emitPhase(onProgress, "bitget_research");
  const [companiesWithMarketEvidence, market_research] = await Promise.all([
    attachBitgetEquityEvidence(companiesWithUncertainty),
    fetchMarketResearch({
      industry: profile.label,
      companies: companiesWithUncertainty,
    }),
  ]);

  emitPhase(onProgress, "events");
  const eventResult = buildEventIntelligence(
    profile,
    companiesWithMarketEvidence,
    market_research,
  );
  const companiesWithEventEvidence = eventResult.companies;
  const conclusion = buildThroatScanConclusion(profile, companiesWithEventEvidence);
  const final_decision = buildFinalDecisionLayer(profile, companiesWithEventEvidence, reasoning);
  const low_confidence = reasoning.confidence_level === "LOW";
  const selectedTickers = new Set(eventResult.intelligence.simulated_decision.selected_tickers);
  const topFive = companiesWithEventEvidence.filter((company) =>
    selectedTickers.has(company.ticker),
  );

  emitPhase(onProgress, "backtest");
  const backtest = await runBacktestValidation(topFive);
  const industry_map = await buildIndustryMap(profile, companiesWithEventEvidence, backtest);
  const thesis_audit = buildThesisAudit({
    profile,
    companies: companiesWithEventEvidence,
    industryMap: industry_map,
    marketResearch: market_research,
    eventIntelligence: eventResult.intelligence,
    backtest,
  });

  emitPhase(onProgress, "discovery");
  const curatedTickers = companiesWithEventEvidence.map((company) => company.ticker);
  const gicsPrefix =
    profile.interpretation.gics?.gics_code_prefix ??
    profile.interpretation.gics?.gics_code?.slice(0, 6) ??
    "45";
  const [hintDiscovery, gicsDiscovery] = await Promise.all([
    discoverBitgetListedCandidates({
      curatedTickers,
      sectorTags: profile.interpretation.sector_tags,
      keywords: reasoning.intent.sector_signals,
      limit: 12,
    }),
    discoverBitgetCandidatesByGicsPrefix({
      gicsCodePrefix: gicsPrefix,
      curatedTickers,
      limit: 12,
    }),
  ]);
  const bitget_discovery = mergeDiscoveryResults(hintDiscovery, gicsDiscovery, 16);

  emitPhase(onProgress, "completeness");
  const completeness = await buildCompletenessPack({
    profile,
    companies: companiesWithEventEvidence,
    marketResearch: market_research,
    eventIntelligence: eventResult.intelligence,
    backtest,
    universeCoverage: reasoning.universe_coverage,
    discoveryCandidateCount: bitget_discovery.discovery_count,
  });

  return {
    industry: profile.label,
    interpretation: profile.interpretation,
    summary: profile.summary,
    selection_rationale: profile.selection_rationale,
    reasoning_chain: profile.reasoning_chain,
    structured_report: reasoning.structured_report,
    audit_trail: reasoning.audit_trail,
    confidence: reasoning.confidence,
    confidence_level: reasoning.confidence_level,
    uncertain_mapping: reasoning.uncertain_mapping,
    uncertainty_message: reasoning.uncertainty_message,
    low_confidence,
    chain: profile.chain,
    companies: companiesWithEventEvidence,
    conclusion,
    final_decision,
    reasoning_intelligence,
    market_research,
    event_intelligence: eventResult.intelligence,
    industry_map,
    thesis_audit,
    universe_coverage: reasoning.universe_coverage,
    completeness,
    backtest,
    bitget_discovery,
    analyzedAt: new Date().toISOString(),
  };
}
