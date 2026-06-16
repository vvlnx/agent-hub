import type { AnalysisResult } from "./mockData";
import { buildConclusionNarrative } from "./i18n/content";
import { translateAnalysisContent } from "./i18n/localizeResult";
import { getThroatRoleLabel } from "./i18n/ui";
import type { Locale } from "./i18n/types";

export function localizeAnalysisResult(
  result: AnalysisResult,
  locale: Locale,
): AnalysisResult {
  if (locale === "en") {
    return result;
  }

  const translated = translateAnalysisContent(result, locale);

  return {
    ...translated,
    conclusion: {
      ...translated.conclusion,
      narrative: buildConclusionNarrative(
        locale,
        translated.conclusion.bottleneck_location,
        translated.conclusion.primary_bottleneck,
        translated.conclusion.high_score_non_bottlenecks,
        (role) => getThroatRoleLabel(locale, role),
        translated.interpretation.sector_tags,
      ),
    },
  };
}
