/** GICS hierarchy (S&P / MSCI Global Industry Classification Standard). */
export interface GicsClassification {
  sector: string;
  industry_group: string;
  industry: string;
  sub_industry?: string;
  sector_zh?: string;
  industry_group_zh?: string;
  industry_zh?: string;
  sub_industry_zh?: string;
}

export type GicsMappingKind = "canonical" | "theme" | "partial" | "unknown";

/** GICS path resolved from a user industry query (Phase 0 — display only). */
export interface GicsQueryMapping {
  classification: GicsClassification;
  mapping_kind: GicsMappingKind;
  canonical_query: string | null;
  notes_en: string;
  notes_zh: string;
}

export function formatGicsPath(
  gics: GicsClassification,
  locale: "en" | "zh" = "en",
): string {
  const parts =
    locale === "zh"
      ? [
          gics.sector_zh ?? gics.sector,
          gics.industry_group_zh ?? gics.industry_group,
          gics.industry_zh ?? gics.industry,
          gics.sub_industry_zh ?? gics.sub_industry,
        ].filter(Boolean)
      : [gics.sector, gics.industry_group, gics.industry, gics.sub_industry].filter(Boolean);
  return parts.join(" → ");
}
