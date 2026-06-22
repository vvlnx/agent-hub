import type { AnalysisResult } from "@/lib/mockData";
import type { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n";

export function EquityTradabilityPanel({
  result,
  locale,
}: {
  result: AnalysisResult;
  locale: Locale;
}) {
  const copy = t(locale);
  const guide = result.completeness.tradability_guide;
  const novelty = result.completeness.novelty;
  const discovery = result.bitget_discovery;
  const tierA = result.event_intelligence.simulated_decision.selected_tickers;
  const tierB = result.event_intelligence.simulated_decision.app_handoff_tickers;

  const showPanel =
    !guide.direct_execution_available ||
    guide.app_handoff_available ||
    discovery.discovery_count > 0;

  if (!showPanel && guide.direct_execution_available) {
    return (
      <section className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="text-sm font-semibold text-emerald-900">{copy.tradabilityGuide}</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-800/90">
          {locale === "zh" ? guide.summary_zh : guide.summary_en}
        </p>
        <p className="mt-2 text-xs text-emerald-700/80">
          {locale === "zh" ? guide.execution_tier_summary_zh : guide.execution_tier_summary_en}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">{copy.tradabilityGuide}</h3>
        <p className="mt-2 text-sm leading-6 text-amber-900/90">
          {locale === "zh" ? guide.summary_zh : guide.summary_en}
        </p>
        <p className="mt-2 text-xs text-amber-800/80">
          {locale === "zh" ? guide.execution_tier_summary_zh : guide.execution_tier_summary_en}
        </p>

        {tierA.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              {copy.tierAExecutable}
            </p>
            <p className="mt-1 font-mono text-sm text-emerald-900">{tierA.join(", ")}</p>
          </div>
        ) : null}

        {tierB.length > 0 ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
              {copy.tierBAppHandoff}
            </p>
            <p className="font-mono text-sm text-sky-900">{tierB.join(", ")}</p>
            {guide.app_handoff_plans.map((plan) => (
              <div
                key={plan.ticker}
                className="rounded-lg border border-sky-200 bg-white/80 p-3"
              >
                <p className="font-mono text-sm font-semibold text-sky-900">{plan.ticker}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-sky-900/85">
                  {(locale === "zh" ? plan.steps_zh : plan.steps_en).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="mt-2 text-[11px] text-sky-800/70">
                  {locale === "zh" ? plan.disclaimer_zh : plan.disclaimer_en}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {guide.research_only_tickers.length > 0 ? (
          <p className="mt-3 text-xs text-amber-800/80">
            {copy.researchOnlyNames}: {guide.research_only_tickers.join(", ")}
          </p>
        ) : null}

        {guide.online_proxy_options.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-amber-900">{copy.proxyOptions}</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
              {guide.online_proxy_options.map((option) => (
                <li key={option.bitget_symbol}>
                  <span className="font-mono font-semibold">{option.bitget_symbol}</span> —{" "}
                  {locale === "zh" ? option.role_zh : option.role_en}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-3 text-sm font-medium text-amber-900">
          {copy.tradabilityNextStep}:{" "}
          {locale === "zh" ? guide.recommended_action_zh : guide.recommended_action_en}
        </p>
      </div>

      {discovery.discovery_count > 0 ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <h3 className="text-sm font-semibold text-violet-900">{copy.bitgetDiscoveryTitle}</h3>
          <p className="mt-2 text-xs leading-5 text-violet-900/90">
            {locale === "zh" ? discovery.summary_zh : discovery.summary_en}
          </p>
          <p className="mt-2 text-[11px] text-violet-800/75">
            {copy.catalogStats}: Tier A {novelty.bitget_tier_a_count} · Tier B catalog{" "}
            {novelty.bitget_tier_b_count} · {copy.totalCatalogTickers}{" "}
            {novelty.bitget_catalog_ticker_count}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {discovery.entries.map((entry) => (
              <li
                key={entry.ticker}
                className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-mono text-violet-900"
              >
                {entry.ticker}
                <span className="ml-1 text-violet-600/80">T{entry.execution_tier}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-violet-800/70">{copy.discoveryDisclaimer}</p>
        </div>
      ) : null}
    </section>
  );
}
