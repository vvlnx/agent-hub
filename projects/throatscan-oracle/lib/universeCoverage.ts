import { normalizeIndustryQuery } from "./industryAliases";
import type { CompanyMatchReason } from "./reasoning/types";

export type UniverseCoverageLevel = "full" | "partial" | "out_of_scope";

export interface UniverseCoverage {
  level: UniverseCoverageLevel;
  universe_size: number;
  matched_count: number;
  avg_query_alignment: number;
  avg_sector_similarity: number;
  canonical_industry: string | null;
  is_canonical_match: boolean;
  summary_en: string;
  summary_zh: string;
  recommended_demo_inputs: string[];
}

/** Canonical queries with verified, high-quality universe mapping for demos. */
export const DEMO_CANONICAL_INDUSTRIES = [
  "ai chips",
  "semiconductor",
  "ai data center",
  "ev battery",
  "oil and gas",
  "biotech",
  "nuclear",
  "robotics",
  "automotive",
  "fintech",
  "defense",
  "space",
  "quantum computing",
  "cybersecurity",
  "solar",
  "rare earth",
  "carbon capture",
  "agriculture fertilizer",
  "financials banking",
  "consumer retail",
  "healthcare services",
  "utilities power grid",
  "telecom broadband",
  "media streaming",
  "logistics shipping",
] as const;

const CANONICAL_SET = new Set<string>(DEMO_CANONICAL_INDUSTRIES);

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function resolveCanonicalIndustry(rawInput: string): string | null {
  const normalized = normalizeIndustryQuery(rawInput).toLowerCase();
  if (CANONICAL_SET.has(normalized)) return normalized;

  for (const canonical of DEMO_CANONICAL_INDUSTRIES) {
    if (normalized.includes(canonical) || canonical.includes(normalized)) {
      return canonical;
    }
  }

  return null;
}

export function assessUniverseCoverage(
  rawInput: string,
  matches: CompanyMatchReason[],
  universeSize: number,
): UniverseCoverage {
  const canonical = resolveCanonicalIndustry(rawInput);
  const isCanonicalMatch = canonical !== null;
  const alignments = matches.map((match) => match.composite);
  const queryAlignments = matches.map((match) =>
    Math.min(100, Math.round(match.sector_similarity * 0.4 + match.role_fit * 0.6)),
  );
  const avgQueryAlignment = Math.round(average(queryAlignments));
  const avgSectorSimilarity = Math.round(average(matches.map((match) => match.sector_similarity)));
  const matchedCount = matches.length;

  let level: UniverseCoverageLevel;
  if (
    isCanonicalMatch &&
    matchedCount >= 3 &&
    avgQueryAlignment >= 45
  ) {
    level = "full";
  } else if (
    matchedCount >= 3 &&
    avgQueryAlignment >= 50 &&
    avgSectorSimilarity >= 30
  ) {
    level = "full";
  } else if (matchedCount >= 1 && avgQueryAlignment >= 30) {
    level = "partial";
  } else {
    level = "out_of_scope";
  }

  const recommended_demo_inputs = [...DEMO_CANONICAL_INDUSTRIES.slice(0, 6)];

  let summary_en: string;
  let summary_zh: string;

  if (level === "full") {
    summary_en = isCanonicalMatch
      ? `This query maps to the curated ${canonical} coverage set (${matchedCount}/${universeSize} universe names matched with strong alignment).`
      : `Query alignment is strong (${avgQueryAlignment}/100) across ${matchedCount} constrained candidates from the ${universeSize}-name public-company universe.`;
    summary_zh = isCanonicalMatch
      ? `该查询命中已验证的「${canonical}」覆盖集（${universeSize} 家公司库中匹配 ${matchedCount} 家，对齐度良好）。`
      : `查询对齐度良好（${avgQueryAlignment}/100），${universeSize} 家公司库中匹配 ${matchedCount} 家约束候选。`;
  } else if (level === "partial") {
    summary_en = `Partial universe coverage only (${matchedCount} candidates, avg alignment ${avgQueryAlignment}/100). Treat results as directional proxies, not a complete industry map.`;
    summary_zh = `仅部分覆盖（${matchedCount} 个候选，平均对齐 ${avgQueryAlignment}/100）。结果应视为方向性代理，而非完整行业映射。`;
  } else {
    summary_en = `This niche query sits outside the current ${universeSize}-company public universe. Structural reasoning still runs, but company mapping is weak and should not be presented as a full thesis. Try a canonical demo industry instead.`;
    summary_zh = `该冷门查询超出当前 ${universeSize} 家上市公司库覆盖范围。结构性推理仍会运行，但公司映射较弱，不应作为完整 thesis 展示。建议改用已验证的演示行业。`;
  }

  void alignments;

  return {
    level,
    universe_size: universeSize,
    matched_count: matchedCount,
    avg_query_alignment: avgQueryAlignment,
    avg_sector_similarity: avgSectorSimilarity,
    canonical_industry: canonical,
    is_canonical_match: isCanonicalMatch,
    summary_en,
    summary_zh,
    recommended_demo_inputs,
  };
}

export function coverageUncertaintyMessage(coverage: UniverseCoverage): string | undefined {
  if (coverage.level === "out_of_scope") {
    return `OUT OF UNIVERSE COVERAGE — ${coverage.summary_en} Recommended demos: ${coverage.recommended_demo_inputs.slice(0, 4).join(", ")}.`;
  }
  if (coverage.level === "partial" && coverage.avg_query_alignment < 45) {
    return `PARTIAL UNIVERSE COVERAGE — avg alignment ${coverage.avg_query_alignment}/100. Candidates are proxies; do not treat as exhaustive industry mapping.`;
  }
  return undefined;
}
