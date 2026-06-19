import { writeFileSync } from "node:fs";
import { analyzeIndustry } from "../lib/agent.ts";

const industry = process.argv[2] ?? "AI chips";
const result = await analyzeIndustry(industry);

const payload = {
  schema_version: "throatscan-run-evidence-v2",
  project: "ThroatScan Oracle",
  sample: true,
  industry_input: industry,
  exported_at: new Date().toISOString(),
  run_id: result.structured_report.run_id,
  confidence: {
    score: result.confidence,
    level: result.confidence_level,
  },
  universe_coverage: result.universe_coverage,
  completeness: result.completeness,
  thesis_audit: result.thesis_audit,
  backtest: {
    status: result.backtest.status,
    period: result.backtest.period,
    evidence_hash: result.backtest.evidence_hash,
    metrics: result.backtest.metrics,
  },
  event_intelligence: {
    simulated_decision: result.event_intelligence.simulated_decision,
  },
  disclosure:
    "Sample evidence export for judges. Full run exports include candles, trades, and research raw data.",
};

const outPath = new URL("../public/sample-evidence-ai-chips.json", import.meta.url);
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${outPath.pathname}`);
