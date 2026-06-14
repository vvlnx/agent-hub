import { runBacktestValidation } from "./backtest";
import { buildThroatScanConclusion } from "./conclusion";
import {
  getIndustryPreset,
  normalizeAnalysisCompanies,
  resolveIndustryId,
  type AnalysisResult,
} from "./mockData";
import { scoreCompanies } from "./scoring";

const ANALYSIS_DELAY_MS = 900;

export async function analyzeIndustry(industry: string): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, ANALYSIS_DELAY_MS));

  const industryId = resolveIndustryId(industry);
  const preset = getIndustryPreset(industry);
  const companies = normalizeAnalysisCompanies(scoreCompanies(preset.companies, industryId));
  const conclusion = buildThroatScanConclusion(preset, companies);
  const topFive = companies.slice(0, 5);
  const backtest = runBacktestValidation(topFive);

  return {
    industry: industryId,
    summary: preset.summary,
    chain: preset.chain,
    companies,
    conclusion,
    backtest,
    analyzedAt: new Date().toISOString(),
  };
}
