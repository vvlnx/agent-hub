import type { AnalysisResult } from "@/lib/mockData";
import { t, type Locale } from "@/lib/i18n";

type Copy = ReturnType<typeof t>;

export function AgentWorkflowPanel({
  result,
  locale,
  copy,
}: {
  result: AnalysisResult;
  locale: Locale;
  copy: Copy;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-panel)] p-4">
        <div className="flex flex-wrap gap-2">
          {result.completeness.novelty.mcp_tools_used.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-[var(--cursor-accent)]/25 bg-[var(--cursor-accent-dim)] px-2 py-0.5 font-mono text-[10px] text-[var(--cursor-accent)]"
            >
              {tool}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cursor-fg-subtle)]">
            {copy.whyAgentOnly}
          </p>
          <p className="mt-2 text-sm leading-6">
            {locale === "zh"
              ? result.completeness.novelty.why_agent_only_zh
              : result.completeness.novelty.why_agent_only_en}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-[var(--cursor-fg-muted)]">
            {(locale === "zh"
              ? result.completeness.novelty.vs_traditional_screener_zh
              : result.completeness.novelty.vs_traditional_screener_en
            ).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <ol className="mt-4 space-y-2">
          {result.completeness.novelty.agent_workflow.map((step, index) => (
            <li
              key={step.id}
              className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-[var(--cursor-fg-subtle)]">
                    {copy.workflowStep} {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {locale === "zh" ? step.agent_zh : step.agent_en}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-[var(--cursor-accent)]">{step.skill}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    step.status === "complete"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-600"
                      : step.status === "partial"
                        ? "border-amber-400/30 bg-amber-400/10 text-amber-700"
                        : "border-zinc-400/30 bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {step.status === "complete"
                    ? copy.stageComplete
                    : step.status === "partial"
                      ? copy.stagePartial
                      : copy.stageSkipped}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--cursor-fg-muted)]">
                {locale === "zh" ? step.detail_zh : step.detail_en}
              </p>
              {step.tools_used.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {step.tools_used.map((tool) => (
                    <span
                      key={`${step.id}-${tool}`}
                      className="rounded border border-[var(--cursor-border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--cursor-fg-subtle)]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : null}
              {step.fetched_at ? (
                <p className="mt-2 text-[10px] text-[var(--cursor-fg-subtle)]">
                  {copy.fetchedAt}: {step.fetched_at}
                  {step.source_url ? (
                    <>
                      {" · "}
                      <a
                        href={step.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--cursor-accent)] underline"
                      >
                        MCP
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--cursor-border)] p-3">
            <p className="text-xs font-semibold">{copy.hardConstraints}</p>
            <ul className="mt-2 space-y-2">
              {result.completeness.novelty.hard_constraints.map((rule) => (
                <li key={rule.id} className="text-xs">
                  <p className="font-medium">{locale === "zh" ? rule.label_zh : rule.label_en}</p>
                  <p className="mt-0.5 text-[var(--cursor-fg-muted)]">
                    {locale === "zh" ? rule.enforced_zh : rule.enforced_en}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-[var(--cursor-border)] p-3">
            <p className="text-xs font-semibold">{copy.rebalanceAgent}</p>
            <p className="mt-1 font-mono text-[10px] text-[var(--cursor-fg-subtle)]">
              {result.completeness.novelty.rebalance_agent.agent_id}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--cursor-fg-muted)]">
              {locale === "zh"
                ? result.completeness.novelty.rebalance_agent.policy_zh
                : result.completeness.novelty.rebalance_agent.policy_en}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--cursor-fg-muted)]">
              {(locale === "zh"
                ? result.completeness.novelty.rebalance_agent.triggers_zh
                : result.completeness.novelty.rebalance_agent.triggers_en
              ).map((trigger) => (
                <li key={trigger}>• {trigger}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-medium">
              {locale === "zh"
                ? result.completeness.novelty.rebalance_agent.next_action_zh
                : result.completeness.novelty.rebalance_agent.next_action_en}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold">{copy.growthRoadmap}</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {result.completeness.novelty.growth_roadmap.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Phase {phase.phase}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      phase.status === "live"
                        ? "bg-emerald-400/10 text-emerald-700"
                        : phase.status === "partial"
                          ? "bg-amber-400/10 text-amber-700"
                          : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {phase.status === "live"
                      ? copy.phaseLive
                      : phase.status === "partial"
                        ? copy.phasePartial
                        : copy.phasePlanned}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium">
                  {locale === "zh" ? phase.title_zh : phase.title_en}
                </p>
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[var(--cursor-fg-muted)]">
                  {(locale === "zh" ? phase.items_zh : phase.items_en).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {result.completeness.github_repo_url ? (
          <p className="mt-4 text-xs text-[var(--cursor-fg-muted)]">
            GitHub:{" "}
            <a
              href={result.completeness.github_repo_url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--cursor-accent)] underline"
            >
              {result.completeness.github_repo_url}
            </a>
          </p>
        ) : null}
      </div>

      <section className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{copy.judgeSelfAssessment}</h3>
            <p className="mt-1 text-xs text-[var(--cursor-fg-muted)]">{copy.judgeSelfAssessmentHint}</p>
          </div>
          <a
            href={result.completeness.public_demo_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-300"
          >
            {copy.publicDemo}
          </a>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--cursor-fg-muted)]">
          {locale === "zh" ? result.completeness.honest_summary_zh : result.completeness.honest_summary_en}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.completeness.end_to_end_stages.map((pipeStage) => (
            <span
              key={pipeStage.id}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                pipeStage.status === "complete"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : pipeStage.status === "partial"
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                    : "border-zinc-600 bg-zinc-800 text-zinc-400"
              }`}
            >
              {locale === "zh" ? pipeStage.label_zh : pipeStage.label_en}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {result.completeness.judge_self_assessment.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-[var(--cursor-border)] bg-[var(--cursor-sidebar)] p-4"
            >
              <p className="text-sm font-semibold">
                {locale === "zh" ? row.title_zh : row.title_en}
              </p>
              <p className="mt-1 text-xs text-violet-300">
                {locale === "zh" ? row.rating_zh : row.rating_en}
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--cursor-fg-subtle)]">
                {copy.achieved}
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-5 text-[var(--cursor-fg-muted)]">
                {(locale === "zh" ? row.achieved_zh : row.achieved_en).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--cursor-fg-subtle)]">
                {copy.gaps}
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-5 text-[var(--cursor-fg-muted)]">
                {(locale === "zh" ? row.gaps_zh : row.gaps_en).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
