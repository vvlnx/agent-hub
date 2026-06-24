import type { AnalysisResult } from "@/lib/mockData";
import type { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n";

export function GicsResearchPanel({
  result,
  locale,
}: {
  result: AnalysisResult;
  locale: Locale;
}) {
  const copy = t(locale);
  const research = result.gics_research;
  if (!research?.enabled) return null;

  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
            {copy.gicsResearchTitle}
          </h3>
          <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-200/80">
            {copy.gicsResearchHint}
          </p>
        </div>
        <span className="rounded-full border border-indigo-300 bg-white/70 px-2.5 py-0.5 font-mono text-[10px] text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
          {research.channel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {research.tools_used.map((tool) => (
          <span
            key={tool}
            className="rounded-full border border-indigo-200 bg-white/80 px-2 py-0.5 font-mono text-[10px] text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            {tool}
          </span>
        ))}
      </div>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-indigo-200 bg-white/70 p-2 dark:border-indigo-900 dark:bg-indigo-950/40">
          <dt className="font-semibold text-indigo-900 dark:text-indigo-100">{copy.gicsPrefix}</dt>
          <dd className="mt-0.5 font-mono text-indigo-800 dark:text-indigo-200">
            {research.gics_code_prefix}
          </dd>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white/70 p-2 dark:border-indigo-900 dark:bg-indigo-950/40">
          <dt className="font-semibold text-indigo-900 dark:text-indigo-100">{copy.gicsPeerCount}</dt>
          <dd className="mt-0.5 font-mono text-indigo-800 dark:text-indigo-200">
            {research.peer_count}
          </dd>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white/70 p-2 dark:border-indigo-900 dark:bg-indigo-950/40">
          <dt className="font-semibold text-indigo-900 dark:text-indigo-100">{copy.gicsReports}</dt>
          <dd className="mt-0.5 font-mono text-indigo-800 dark:text-indigo-200">
            {research.reports.length}
          </dd>
        </div>
      </dl>

      {research.peer_tickers.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">
            {copy.gicsPeerSample}
          </p>
          <p className="mt-1 font-mono text-xs text-indigo-900 dark:text-indigo-100">
            {research.peer_tickers.slice(0, 24).join(", ")}
            {research.peer_tickers.length > 24 ? "…" : ""}
          </p>
        </div>
      ) : null}

      {research.warnings.length > 0 ? (
        <ul className="mt-3 space-y-1 text-[11px] text-amber-800 dark:text-amber-200">
          {research.warnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-4">
        {research.reports.map((report) => {
          const workflow = research.workflow_plans.find((plan) => plan.ticker === report.ticker);
          const orgRoles = research.org_roles_by_ticker[report.ticker] ?? [];

          return (
            <article
              key={report.ticker}
              className="rounded-lg border border-indigo-200 bg-white/80 p-3 dark:border-indigo-900 dark:bg-indigo-950/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-indigo-950 dark:text-indigo-100">
                  {report.ticker}
                  {report.name ? ` · ${report.name}` : ""}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    report.status === "available"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {report.status === "available" ? copy.gicsReportLive : copy.gicsReportStub}
                </span>
              </div>

              {workflow ? (
                <div className="mt-3 rounded border border-indigo-100 bg-indigo-50/50 p-2 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <p className="text-[10px] font-semibold uppercase text-indigo-800 dark:text-indigo-300">
                    {copy.gicsWorkflowPlan}
                  </p>
                  {workflow.search_queries.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-indigo-900/90 dark:text-indigo-100/90">
                      {workflow.search_queries.slice(0, 4).map((query) => (
                        <li key={query}>• {query}</li>
                      ))}
                    </ul>
                  ) : null}
                  {workflow.system_prompt ? (
                    <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-indigo-900/75 dark:text-indigo-100/75">
                      {workflow.system_prompt}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {orgRoles.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase text-indigo-800 dark:text-indigo-300">
                    {copy.gicsOrgRoles}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {orgRoles.map((role) => (
                      <li
                        key={role.role_slug}
                        className="rounded-full border border-indigo-200 px-2 py-0.5 text-[10px] text-indigo-900 dark:border-indigo-800 dark:text-indigo-100"
                      >
                        {role.role_name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {report.report_md ? (
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-indigo-100 bg-indigo-50/30 p-2 font-mono text-[11px] leading-5 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-100">
                  {report.report_md}
                </pre>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
