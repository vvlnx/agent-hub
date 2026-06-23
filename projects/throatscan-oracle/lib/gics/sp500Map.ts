import sp500Pack from "../../data/gics-sp500-map.json";
import type { GicsClassification } from "./types";

interface Sp500GicsEntry {
  gics_code: string;
  company_name?: string;
  description?: string;
  sector: string;
  industry_group: string;
  industry: string;
  sub_industry?: string;
  sector_zh?: string;
  industry_group_zh?: string;
  industry_zh?: string;
  sub_industry_zh?: string;
}

interface Sp500GicsPack {
  schema_version: string;
  source: string;
  exported_at: string;
  stats: {
    mode?: string;
    mapped?: number;
  };
  tickers: Record<string, Sp500GicsEntry>;
}

const pack = sp500Pack as Sp500GicsPack;

function toClassification(entry: Sp500GicsEntry): GicsClassification {
  return {
    sector: entry.sector,
    industry_group: entry.industry_group,
    industry: entry.industry,
    sub_industry: entry.sub_industry,
    sector_zh: entry.sector_zh,
    industry_group_zh: entry.industry_group_zh,
    industry_zh: entry.industry_zh,
    sub_industry_zh: entry.sub_industry_zh,
  };
}

const SP500_GICS: Record<string, GicsClassification> = Object.fromEntries(
  Object.entries(pack.tickers).map(([ticker, entry]) => [ticker.toUpperCase(), toClassification(entry)]),
);

export function getSp500Gics(ticker: string): GicsClassification | undefined {
  return SP500_GICS[ticker.toUpperCase()];
}

export const GICS_SP500_COUNT = Object.keys(SP500_GICS).length;
export const GICS_SP500_EXPORTED_AT = pack.exported_at;
export const GICS_SP500_SOURCE_MODE = pack.stats.mode ?? "unknown";
