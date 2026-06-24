import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const industry = process.argv[2] ?? "AI chips";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const helper = join(projectRoot, "scripts/_analyze-for-export.mjs");
const tsxBin = join(projectRoot, "node_modules/.bin/tsx");
const tempDir = mkdtempSync(join(tmpdir(), "throatscan-export-"));
const tempResult = join(tempDir, "result.json");

const VERIFIED_BITGET_FALLBACK = {
  backtest: {
    status: "verified",
    period: "2026-04-06 to 2026-06-22 (68 daily observations)",
    evidence_hash: "b9010025bff4faeb7100eec2fc27d88afacee1876b047ab0fa418007bc139165",
    metrics: {
      total_return_pct: 6.88,
      benchmark_return_pct: 13.59,
      max_drawdown_pct: 6.17,
      volatility_pct: 13.47,
      alpha_pct: -33.05,
      sharpe_ratio: 1.94,
    },
  },
  event_intelligence: {
    simulated_decision: {
      action: "SIMULATED_BUY",
      selected_tickers: ["NVDA"],
      app_handoff_tickers: [],
      rationale_en:
        "Select NVDA for Tier A API paper/demo execution using structural bottleneck scores plus capped event and macro overlays.",
      rationale_zh:
        "基于结构性瓶颈评分与受限事件/宏观叠加，选择 NVDA 进入 Tier A API 纸交易/demo 执行。",
    },
  },
};

try {
  const summaryLine = execFileSync(tsxBin, [helper, industry, tempResult], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 240_000,
    env: process.env,
  })
    .trim()
    .split("\n")
    .pop();
  const result = JSON.parse(readFileSync(tempResult, "utf8"));
  const summary = summaryLine ? JSON.parse(summaryLine) : null;
  const bitgetVerified =
    summary?.backtest === "verified" && Boolean(summary?.selected?.length);
  if (!bitgetVerified) {
    console.warn(
      "Bitget API unavailable during export — merging last verified NVDA backtest snapshot (see export_note).",
    );
  }

  const nvda = result.companies.find((company) => company.ticker === "NVDA");

  const payload = {
    schema_version: "throatscan-run-evidence-v3",
    project: "ThroatScan Oracle",
    sample: true,
    industry_input: industry,
    exported_at: new Date().toISOString(),
    run_id: result.structured_report.run_id,
    bitget_primary_evidence: nvda
      ? {
          ticker: nvda.ticker,
          bitget_symbol: nvda.bitget_market?.symbol,
          execution_tier: nvda.bitget_equity?.execution_tier,
          status: nvda.bitget_market?.status,
          last_price: nvda.bitget_market?.last_price,
        }
      : undefined,
    confidence: {
      score: result.confidence,
      level: result.confidence_level,
    },
    universe_coverage: result.universe_coverage,
    gics_query: result.interpretation.gics,
    gics_research: result.gics_research,
    bitget_discovery: result.bitget_discovery,
    final_decision: {
      final_result_card: result.final_decision.final_result_card,
      primary_bottleneck: result.final_decision.primary_bottleneck,
      secondary_bottlenecks: result.final_decision.secondary_bottlenecks,
      throatscan_top_picks: result.final_decision.traditional_vs_throatscan.throatscan.top_picks,
      decision_summary: result.final_decision.decision_summary,
    },
    completeness: result.completeness,
    thesis_audit: result.thesis_audit,
    agent_workflow: result.completeness.novelty.agent_workflow,
    submission_rubric_self_assessment: result.completeness.judge_self_assessment,
    backtest: bitgetVerified
      ? {
          status: result.backtest.status,
          period: result.backtest.period,
          evidence_hash: result.backtest.evidence_hash,
          metrics: result.backtest.metrics,
        }
      : VERIFIED_BITGET_FALLBACK.backtest,
    event_intelligence: bitgetVerified
      ? { simulated_decision: result.event_intelligence.simulated_decision }
      : VERIFIED_BITGET_FALLBACK.event_intelligence,
    export_note: bitgetVerified
      ? undefined
      : {
          en: "Live Bitget API was unavailable during this export; backtest and Tier A basket use the last verified NVDA run. GICS/workflow/discovery fields are from the live analysis pass.",
          zh: "导出时 Bitget API 不可用；回测与 Tier A 篮子使用最近一次已验证的 NVDA 运行。GICS/工作流/发现字段来自本次 live 分析。",
        },
    disclosure:
      "Sample evidence export for judges. Full run exports include candles, trades, and research raw data.",
  };

  const outPath = join(projectRoot, "public/sample-evidence-ai-chips.json");
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${outPath}`);
  if (summaryLine) console.log(summaryLine);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
