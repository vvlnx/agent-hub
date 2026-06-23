import type { Company } from "../types";
import type { GicsSource } from "./types";
import { fetchRemoteGicsBatch, isGicsApiConfigured } from "./remoteClient";
import { getTickerGics, getTickerGicsSource } from "./tickerMap";

/** Enrich scored companies with GICS — remote API first, then static maps. */
export async function enrichCompaniesWithGics(companies: Company[]): Promise<Company[]> {
  if (companies.length === 0) return companies;

  const remoteByTicker = isGicsApiConfigured()
    ? await fetchRemoteGicsBatch(companies.map((c) => c.ticker))
    : {};

  return companies.map((company) => {
    const ticker = company.ticker.toUpperCase();
    const remote = remoteByTicker[ticker];
    if (remote?.classification) {
      return {
        ...company,
        gics: remote.classification,
        gics_source: "remote" as GicsSource,
      };
    }

    const staticGics = company.gics ?? getTickerGics(ticker);
    const staticSource = getTickerGicsSource(ticker);
    if (!staticGics) {
      return company;
    }

    return {
      ...company,
      gics: staticGics,
      ...(staticSource ? { gics_source: staticSource as GicsSource } : {}),
    };
  });
}
