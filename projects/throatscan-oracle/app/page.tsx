"use client";

import { useMemo, useState } from "react";
import { analyzeIndustry } from "@/lib/agent";
import type { AnalysisResult } from "@/lib/mockData";
import { EquityCurveChart } from "@/components/EquityCurveChart";
import {
  formatBacktestMeta,
  formatBottleneckStrategyScore,
  formatNonBottleneckEntry,
  formatPrimaryBottleneck,
  getBreakdownLabel,
  getThroatRoleLabel,
  t,
  type Locale,
} from "@/lib/i18n";
import { localizeAnalysisResult } from "@/lib/localize";
import { BREAKDOWN_FIELDS, type Company } from "@/lib/types";

function ThroatRoleBadge({ role, locale }: { role: Company["throat_role"]; locale: Locale }) {
  const styles =
    role === "CORE BOTTLENECK"
      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
      : role === "STRATEGIC ENABLER"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : role === "DOWNSTREAM USER"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}>
      {getThroatRoleLabel(locale, role)}
    </span>
  );
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [industry, setIndustry] = useState("Semiconductors");
  const [baseResult, setBaseResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const copy = t(locale);

  const result = useMemo(
    () => (baseResult ? localizeAnalysisResult(baseResult, locale) : null),
    [baseResult, locale],
  );

  async function handleRunAnalysis() {
    setLoading(true);
    try {
      const analysis = await analyzeIndustry(industry);
      setBaseResult(analysis);
    } finally {
      setLoading(false);
    }
  }

  const topCompanies: Company[] = result?.companies.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">ThroatScan Oracle</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">{copy.subtitle}</p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              locale === "en"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {copy.langEn}
          </button>
          <button
            type="button"
            onClick={() => setLocale("zh")}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              locale === "zh"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {copy.langZh}
          </button>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="block text-sm font-medium">
          {copy.industry}
          <input
            type="text"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder={copy.industryPlaceholder}
          />
        </label>

        <button
          type="button"
          onClick={() => void handleRunAnalysis()}
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? copy.running : copy.runAnalysis}
        </button>

        {result ? (
          <div className="space-y-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold">{copy.industryChain}</h2>
              <p className="mt-1 text-sm text-zinc-500">{result.summary}</p>
              <ul className="mt-4 space-y-2">
                {result.chain.map((node) => (
                  <li
                    key={node.name}
                    className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <span className="font-medium">{node.name}</span>
                    <span className="mx-2 text-zinc-400">·</span>
                    <span className="text-zinc-600 dark:text-zinc-300">{node.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold">{copy.top5}</h2>
              <ul className="mt-4 space-y-2">
                {topCompanies.map((company) => (
                  <li
                    key={company.ticker}
                    className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold">{company.ticker}</span>
                          <ThroatRoleBadge role={company.throat_role} locale={locale} />
                        </div>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{company.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">{company.chain_position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">{copy.throatScore}</p>
                        <p className="font-semibold">{company.score}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-900">
                      <p>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {copy.scarceResource}:
                        </span>{" "}
                        {company.why_bottleneck_or_not.scarce_resource}
                      </p>
                      <p>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {copy.canFunctionWithout}:
                        </span>{" "}
                        {company.why_bottleneck_or_not.can_function_without}
                      </p>
                      <p>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {copy.replaceability}:
                        </span>{" "}
                        {company.why_bottleneck_or_not.replaceability_1_to_3_years}
                      </p>
                    </div>

                    <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                      {BREAKDOWN_FIELDS.map((field) => (
                        <li
                          key={field}
                          className="flex items-center justify-between text-xs text-zinc-500"
                        >
                          <span>{getBreakdownLabel(locale, field)}</span>
                          <span>{company.breakdown[field]}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
                {copy.conclusionTitle}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">
                    {copy.whereBottleneck}
                  </dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    {result.conclusion.bottleneck_location}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">
                    {copy.primaryBottleneck}
                  </dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    {formatPrimaryBottleneck(
                      locale,
                      result.conclusion.primary_bottleneck.ticker,
                      result.conclusion.primary_bottleneck.name,
                      result.conclusion.primary_bottleneck.throat_role,
                      result.conclusion.primary_bottleneck.score,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">
                    {copy.highScoreNotChoke}
                  </dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    {result.conclusion.high_score_non_bottlenecks.length > 0
                      ? result.conclusion.high_score_non_bottlenecks
                          .map((company) =>
                            formatNonBottleneckEntry(
                              locale,
                              company.ticker,
                              company.throat_role,
                              company.score,
                            ),
                          )
                          .join(locale === "zh" ? " · " : " · ")
                      : copy.noneInTop}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-red-800 dark:text-red-300">{copy.summary}</dt>
                  <dd className="mt-1 text-red-900/80 dark:text-red-100">
                    {result.conclusion.narrative}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                {copy.backtestTitle}
              </h2>
              <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-100">
                {formatBacktestMeta(
                  locale,
                  result.backtest.period,
                  result.backtest.allocation,
                  result.backtest.rebalance,
                )}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: copy.totalReturn, value: `${result.backtest.metrics.total_return_pct}%` },
                  {
                    label: copy.spyBenchmark,
                    value: `${result.backtest.metrics.benchmark_return_pct}%`,
                  },
                  {
                    label: copy.maxDrawdown,
                    value: `${result.backtest.metrics.max_drawdown_pct}%`,
                  },
                  {
                    label: copy.volatility,
                    value: `${result.backtest.metrics.volatility_pct}%`,
                  },
                  { label: copy.alpha, value: `${result.backtest.metrics.alpha_pct}%` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60"
                  >
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  {formatBottleneckStrategyScore(
                    locale,
                    result.backtest.bottleneck_strategy_score,
                  )}
                </p>
                <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
                  {result.backtest.validation_summary}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {copy.equityCurve}
                </h3>
                <EquityCurveChart
                  data={result.backtest.equity_curve}
                  portfolioLabel={copy.portfolioLine}
                  benchmarkLabel={copy.benchmarkLine}
                />
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200 bg-white/70 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="border-b border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:text-emerald-100">
                  {copy.performanceTable}
                </h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-emerald-700 dark:text-emerald-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{copy.ticker}</th>
                      <th className="px-3 py-2 font-medium">{copy.role}</th>
                      <th className="px-3 py-2 font-medium">{copy.weight}</th>
                      <th className="px-3 py-2 font-medium">{copy.totalReturn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.backtest.holdings.map((holding) => (
                      <tr
                        key={holding.ticker}
                        className="border-t border-emerald-100 dark:border-emerald-900"
                      >
                        <td className="px-3 py-2 font-mono">{holding.ticker}</td>
                        <td className="px-3 py-2 text-xs">
                          {getThroatRoleLabel(locale, holding.throat_role)}
                        </td>
                        <td className="px-3 py-2">{holding.weight_pct}%</td>
                        <td className="px-3 py-2">{holding.total_return_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200 bg-white/70 dark:border-emerald-900 dark:bg-emerald-950/60">
                <h3 className="border-b border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:text-emerald-100">
                  {copy.bottleneckVsNon}
                </h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-emerald-700 dark:text-emerald-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{copy.roleGroup}</th>
                      <th className="px-3 py-2 font-medium">{copy.tickers}</th>
                      <th className="px-3 py-2 font-medium">{copy.basketReturn}</th>
                      <th className="px-3 py-2 font-medium">{copy.avgMonthly}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.backtest.role_comparison.map((row) => (
                      <tr
                        key={row.role}
                        className="border-t border-emerald-100 dark:border-emerald-900"
                      >
                        <td className="px-3 py-2 font-medium">
                          {getThroatRoleLabel(locale, row.role)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {row.tickers.length > 0 ? row.tickers.join(", ") : "—"}
                        </td>
                        <td className="px-3 py-2">{row.total_return_pct}%</td>
                        <td className="px-3 py-2">{row.avg_monthly_return_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
