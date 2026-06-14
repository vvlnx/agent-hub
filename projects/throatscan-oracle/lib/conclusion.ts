import type { Company, ThroatScanConclusion } from "./types";
import { isCoreBottleneck, normalizeCompany } from "./types";
import type { IndustryPreset } from "./mockData";

export function buildThroatScanConclusion(
  preset: IndustryPreset,
  companies: Company[],
): ThroatScanConclusion {
  const normalizedCompanies = companies.map((company) => normalizeCompany(company));

  const primaryFromPreset = normalizedCompanies.find(
    (company) => company.ticker === preset.primary_bottleneck_ticker,
  );

  const primaryFromRole = normalizedCompanies
    .filter((company) => isCoreBottleneck(company.throat_role))
    .sort((a, b) => b.score - a.score)[0];

  const primary_bottleneck = normalizeCompany(
    primaryFromPreset ?? primaryFromRole ?? normalizedCompanies[0],
  );

  const topRanked = normalizedCompanies.slice(0, 5);
  const high_score_non_bottlenecks = topRanked.filter(
    (company) =>
      company.ticker !== primary_bottleneck.ticker &&
      !isCoreBottleneck(company.throat_role),
  );

  const nonBottleneckNames =
    high_score_non_bottlenecks.length > 0
      ? high_score_non_bottlenecks
          .map((company) => `${company.ticker} (${company.throat_role})`)
          .join(", ")
      : "None in the current top-ranked set";

  const narrative = [
    `Primary bottleneck node: ${preset.bottleneck_location}.`,
    `True choke point: ${primary_bottleneck.ticker} — ${primary_bottleneck.name} (${primary_bottleneck.throat_role}).`,
    `High-ranked but not choke points: ${nonBottleneckNames}.`,
  ].join(" ");

  return {
    bottleneck_location: preset.bottleneck_location,
    primary_bottleneck,
    high_score_non_bottlenecks,
    narrative,
  };
}
