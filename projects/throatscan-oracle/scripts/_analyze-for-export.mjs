import { writeFileSync } from "node:fs";
import { analyzeIndustry } from "../lib/agent.ts";
import { clearBitgetPublicCache, warmBitgetPublicCache } from "../lib/bitgetCache.ts";

const industry = process.argv[2] ?? "AI chips";
const outPath = process.argv[3];
if (!outPath) {
  console.error("Usage: tsx _analyze-for-export.mjs [industry] <temp-result.json>");
  process.exit(1);
}

let result;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  if (attempt > 1) {
    clearBitgetPublicCache();
    await new Promise((resolve) => setTimeout(resolve, 5_000 * attempt));
  }
  await warmBitgetPublicCache();
  result = await analyzeIndustry(industry);
  const verified =
    result.backtest.status === "verified" &&
    result.event_intelligence.simulated_decision.selected_tickers.length > 0;
  if (verified) break;
  console.warn(`Analyze attempt ${attempt}/3: backtest=${result.backtest.status}, tier_a=none`);
}

writeFileSync(outPath, JSON.stringify(result));
console.log(
  JSON.stringify({
    selected: result.event_intelligence.simulated_decision.selected_tickers,
    backtest: result.backtest.status,
    discovery: result.bitget_discovery.discovery_count,
    workflow: result.completeness.novelty.agent_workflow.length,
  }),
);
