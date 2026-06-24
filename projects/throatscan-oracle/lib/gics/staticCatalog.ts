import sp500Pack from "../../data/gics-sp500-map.json";
import { TICKER_GICS } from "./tickerMap";
import type { GicsClassification } from "./types";

export interface GicsCatalogEntry {
  ticker: string;
  gics_code: string;
  company_name?: string;
  description?: string;
  classification: GicsClassification;
  source: "sp500" | "curated";
}

interface Sp500RawEntry {
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

const sp500Tickers = (sp500Pack as { tickers: Record<string, Sp500RawEntry> }).tickers;

function toClassification(entry: Sp500RawEntry): GicsClassification {
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

const SP500_ENTRIES: GicsCatalogEntry[] = Object.entries(sp500Tickers).map(([ticker, entry]) => ({
  ticker: ticker.toUpperCase(),
  gics_code: entry.gics_code,
  company_name: entry.company_name,
  description: entry.description,
  classification: toClassification(entry),
  source: "sp500" as const,
}));

const CURATED_ENTRIES: GicsCatalogEntry[] = Object.entries(TICKER_GICS)
  .filter(([ticker]) => !sp500Tickers[ticker])
  .map(([ticker, classification]) => ({
    ticker: ticker.toUpperCase(),
    gics_code: inferGicsCodeFromClassification(classification),
    company_name: ticker,
    classification,
    source: "curated" as const,
  }));

const ALL_ENTRIES: GicsCatalogEntry[] = [...SP500_ENTRIES, ...CURATED_ENTRIES];

const BY_TICKER = new Map(ALL_ENTRIES.map((entry) => [entry.ticker, entry]));

/** Best-effort code when curated map has no explicit gics_code. */
function inferGicsCodeFromClassification(classification: GicsClassification): string {
  const match = SP500_ENTRIES.find(
    (entry) =>
      entry.classification.sector === classification.sector &&
      entry.classification.industry === classification.industry &&
      (entry.classification.sub_industry ?? "") === (classification.sub_industry ?? ""),
  );
  if (match) return match.gics_code;
  const sectorMatch = SP500_ENTRIES.find((entry) => entry.classification.sector === classification.sector);
  if (sectorMatch) return sectorMatch.gics_code.slice(0, 2);
  return "00000000";
}

export function getCatalogEntry(ticker: string): GicsCatalogEntry | undefined {
  return BY_TICKER.get(ticker.toUpperCase());
}

export function listCompaniesByGicsPrefix(prefix: string, limit = 200): GicsCatalogEntry[] {
  const code = prefix.replace(/\D/g, "");
  if (!code) return [];
  return ALL_ENTRIES.filter((entry) => entry.gics_code.startsWith(code))
    .sort((a, b) => a.ticker.localeCompare(b.ticker))
    .slice(0, limit);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((token) => token.length > 1);
}

function scoreTextMatch(queryTokens: string[], ...fields: (string | undefined)[]): number {
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += token.length >= 4 ? 3 : 2;
  }
  return score;
}

export interface GicsSearchHit {
  gics_code: string;
  classification: GicsClassification;
  score: number;
  matched_label_en: string;
  matched_label_zh?: string;
}

/** Search unique GICS paths in the static catalog (SP500 + curated). */
export function searchGicsByQuery(rawInput: string, limit = 5): GicsSearchHit[] {
  const tokens = tokenize(rawInput);
  if (tokens.length === 0) return [];

  const seen = new Set<string>();
  const hits: GicsSearchHit[] = [];

  for (const entry of ALL_ENTRIES) {
    const key = entry.gics_code;
    if (seen.has(key)) continue;
    const score =
      scoreTextMatch(
        tokens,
        entry.classification.sector,
        entry.classification.industry_group,
        entry.classification.industry,
        entry.classification.sub_industry,
        entry.classification.sector_zh,
        entry.classification.industry_group_zh,
        entry.classification.industry_zh,
        entry.classification.sub_industry_zh,
        entry.company_name,
        entry.ticker,
      ) + (entry.source === "sp500" ? 0.5 : 0);

    if (score <= 0) continue;
    seen.add(key);
    hits.push({
      gics_code: entry.gics_code,
      classification: entry.classification,
      score,
      matched_label_en: entry.classification.sub_industry ?? entry.classification.industry,
      matched_label_zh: entry.classification.sub_industry_zh ?? entry.classification.industry_zh,
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function gicsPrefixForClassification(classification: GicsClassification): string {
  const hit = searchGicsByQuery(
    [classification.sub_industry, classification.industry, classification.sector].filter(Boolean).join(" "),
    1,
  )[0];
  if (hit) {
    if (classification.sub_industry) return hit.gics_code.slice(0, 8);
    if (classification.industry) return hit.gics_code.slice(0, 6);
    return hit.gics_code.slice(0, 4);
  }
  return "45";
}

export function sectorsAlign(codeA?: string, codeB?: string): boolean {
  if (!codeA || !codeB) return false;
  return codeA.slice(0, 2) === codeB.slice(0, 2);
}

export function industryGroupsAlign(codeA?: string, codeB?: string): boolean {
  if (!codeA || !codeB) return false;
  return codeA.slice(0, 4) === codeB.slice(0, 4);
}

export const GICS_CATALOG_TICKER_COUNT = ALL_ENTRIES.length;
