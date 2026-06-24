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
import {
  buildGicsResearch,
  discoverBitgetCandidatesByGicsPrefix,
  mergeDiscoveryResults,
} from "./gics";
import { fetchMarketResearch } from "./marketResearch";
import { buildEventIntelligence } from "./eventIntelligence";
import { buildIndustryMap } from "./industryMap";
import { buildCompletenessPack } from "./completeness/buildCompletenessPack";
import { buildThesisAudit } from "./thesisAudit";

const MOCK_DELAY_MS = 300;

export async function analyzeIndustry(industry: string): Promise<AnalysisResult> {
  if (!isLLMConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  }

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

  const [companiesWithMarketEvidence, market_research] = await Promise.all([
    attachBitgetEquityEvidence(companiesWithUncertainty),
    fetchMarketResearch({
      industry: profile.label,
      companies: companiesWithUncertainty,
    }),
  ]);
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
  const curatedTickers = companiesWithEventEvidence.map((company) => company.ticker);
  const hintDiscovery = await discoverBitgetListedCandidates({
    curatedTickers,
    sectorTags: profile.interpretation.sector_tags,
    keywords: reasoning.intent.sector_signals,
    limit: 12,
  });
  const gicsPrefix =
    profile.interpretation.gics?.gics_code_prefix ??
    profile.interpretation.gics?.gics_code?.slice(0, 6) ??
    "45";
  const gicsDiscovery = await discoverBitgetCandidatesByGicsPrefix({
    gicsCodePrefix: gicsPrefix,
    curatedTickers,
    limit: 12,
  });
  const bitget_discovery = mergeDiscoveryResults(hintDiscovery, gicsDiscovery, 16);
  const focusTickers = [
    profile.primary_bottleneck_ticker,
    ...eventResult.intelligence.simulated_decision.selected_tickers,
  ].filter((ticker, index, all) => all.indexOf(ticker) === index);
  const gics_research = await buildGicsResearch({
    industryQuery: industry,
    companies: companiesWithEventEvidence,
    focusTickers: focusTickers.slice(0, 3),
  });
  const completeness = await buildCompletenessPack({
    profile,
    companies: companiesWithEventEvidence,
    marketResearch: market_research,
    eventIntelligence: eventResult.intelligence,
    backtest,
    universeCoverage: reasoning.universe_coverage,
    discoveryCandidateCount: bitget_discovery.discovery_count,
    gicsResearch: gics_research,
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
    gics_research,
    analyzedAt: new Date().toISOString(),
  };
}
