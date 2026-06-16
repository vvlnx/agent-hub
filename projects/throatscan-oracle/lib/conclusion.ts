import type { Company, ThroatScanConclusion } from "./types";
import { isCoreBottleneck, normalizeCompany } from "./types";
import type { IndustryProfile } from "./mockData";

export function buildThroatScanConclusion(
  profile: IndustryProfile,
  companies: Company[],
): ThroatScanConclusion {
  const normalizedCompanies = companies.map((company) => normalizeCompany(company));

  const primaryFromProfile = normalizedCompanies.find(
    (company) => company.ticker === profile.primary_bottleneck_ticker,
  );

  const primaryFromRole = normalizedCompanies
    .filter((company) => isCoreBottleneck(company.throat_role))
    .sort((a, b) => b.score - a.score)[0];

  const primary_bottleneck = normalizeCompany(
    primaryFromProfile ?? primaryFromRole ?? normalizedCompanies[0],
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
    `Primary bottleneck node: ${profile.bottleneck_location}.`,
    `True choke point: ${primary_bottleneck.ticker} — ${primary_bottleneck.name} (${primary_bottleneck.throat_role}).`,
    `Sector mapping: ${profile.interpretation.sector_tags.join(" + ")}.`,
    `High-ranked but not choke points: ${nonBottleneckNames}.`,
  ].join(" ");

  return {
    bottleneck_location: profile.bottleneck_location,
    primary_bottleneck,
    high_score_non_bottlenecks,
    narrative,
  };
}
