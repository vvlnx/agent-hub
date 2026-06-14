import type { AnalysisResult } from "./mockData";
import type { IndustryId } from "./mockData";
import {
  buildConclusionNarrative,
  buildValidationSummary,
  getBottleneckLocation,
  getCompanyLocalizedFields,
  getIndustrySummary,
  getLocalizedChain,
  localizeAllocation,
  localizeBacktestPeriod,
  localizeRebalance,
} from "./i18n/content";
import { getThroatRoleLabel } from "./i18n/ui";
import type { Locale } from "./i18n/types";
import type { Company } from "./types";
import { normalizeCompany } from "./types";

function localizeCompany(company: Company, industryId: IndustryId, locale: Locale): Company {
  const fields = getCompanyLocalizedFields(industryId, company.ticker, locale, {
    chain_position: company.chain_position,
    why_bottleneck_or_not: company.why_bottleneck_or_not,
  });

  return normalizeCompany({
    ...company,
    ...fields,
  });
}

export function localizeAnalysisResult(
  result: AnalysisResult,
  locale: Locale,
): AnalysisResult {
  if (locale === "en") {
    return result;
  }

  const industryId = result.industry;
  const companies = result.companies.map((company) =>
    localizeCompany(company, industryId, locale),
  );
  const primary = localizeCompany(result.conclusion.primary_bottleneck, industryId, locale);
  const high_score_non_bottlenecks = result.conclusion.high_score_non_bottlenecks.map((company) =>
    localizeCompany(company, industryId, locale),
  );
  const bottleneck_location = getBottleneckLocation(industryId, locale);

  const coreComparison = result.backtest.role_comparison.find(
    (row) => row.role === "CORE BOTTLENECK",
  );
  const enablerComparison = result.backtest.role_comparison.find(
    (row) => row.role === "STRATEGIC ENABLER",
  );

  const weight = result.backtest.holdings[0]?.weight_pct ?? 20;
  const count = result.backtest.holdings.length;

  return {
    ...result,
    summary: getIndustrySummary(industryId, locale),
    chain: getLocalizedChain(industryId, locale),
    companies,
    conclusion: {
      bottleneck_location,
      primary_bottleneck: primary,
      high_score_non_bottlenecks,
      narrative: buildConclusionNarrative(
        locale,
        bottleneck_location,
        primary,
        high_score_non_bottlenecks,
        (role) => getThroatRoleLabel(locale, role),
      ),
    },
    backtest: {
      ...result.backtest,
      period: localizeBacktestPeriod(locale),
      allocation: localizeAllocation(locale, count, weight),
      rebalance: localizeRebalance(locale),
      validation_summary: buildValidationSummary(
        locale,
        result.backtest.metrics,
        result.backtest.bottleneck_strategy_score,
        coreComparison?.total_return_pct ?? 0,
        enablerComparison?.total_return_pct ?? 0,
      ),
    },
  };
}
