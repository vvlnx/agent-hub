import { resolveGicsFromQuery as resolveThemeGicsFromQuery } from "./themeMap";
import { searchGicsByQuery, gicsPrefixForClassification } from "./staticCatalog";
import type { GicsQueryMapping } from "./types";

export type GicsQuerySource = "canonical" | "theme" | "static_search" | "unknown";

export interface ResolvedGicsQuery extends GicsQueryMapping {
  gics_code?: string;
  gics_code_prefix: string;
  resolver_source: GicsQuerySource;
}

export async function resolveGicsFromQueryAsync(rawInput: string): Promise<ResolvedGicsQuery> {
  const theme = resolveThemeGicsFromQuery(rawInput);

  if (theme.mapping_kind === "canonical" || theme.mapping_kind === "theme") {
    const prefix = gicsPrefixForClassification(theme.classification);
    return {
      ...theme,
      gics_code: prefix.length >= 6 ? `${prefix.padEnd(8, "0")}` : undefined,
      gics_code_prefix: prefix.slice(0, Math.max(4, prefix.length)),
      resolver_source: theme.mapping_kind === "canonical" ? "canonical" : "theme",
    };
  }

  const hits = searchGicsByQuery(rawInput, 1);
  const top = hits[0];
  if (top && top.score >= 2) {
    return {
      classification: top.classification,
      mapping_kind: "partial",
      canonical_query: null,
      gics_code: top.gics_code,
      gics_code_prefix: top.gics_code.slice(0, 6),
      resolver_source: "static_search",
      notes_en: `Static GICS catalog match: ${top.matched_label_en} (score ${top.score}).`,
      notes_zh: `静态 GICS 目录匹配：${top.matched_label_zh ?? top.matched_label_en}（得分 ${top.score}）。`,
    };
  }

  const prefix = gicsPrefixForClassification(theme.classification);
  return {
    ...theme,
    gics_code_prefix: prefix.slice(0, 4),
    resolver_source: "unknown",
  };
}

/** Sync alias kept for scripts — prefer async resolver in the analysis pipeline. */
export function resolveGicsFromQuery(rawInput: string): GicsQueryMapping {
  return resolveThemeGicsFromQuery(rawInput);
}
