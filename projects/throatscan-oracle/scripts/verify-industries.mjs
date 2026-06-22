import { buildIndustryProfile } from "../lib/industryInference.ts";
import { runReasoningEngine } from "../lib/reasoning/engine.ts";
import { scoreCompaniesFromReasoning } from "../lib/scoring.ts";

const cases = [
  { input: "AI chips", forbidden: ["LLY"] },
  { input: "Semiconductor", forbidden: ["LLY", "XOM"] },
  { input: "EV Battery", forbidden: ["LLY", "XOM"] },
  { input: "Biotech", forbidden: ["NVDA", "ASML", "XOM"] },
  { input: "Oil and Gas", forbidden: ["NVDA", "MSFT", "LLY"] },
  { input: "Nuclear Energy", forbidden: ["NVDA", "MSFT", "LLY"] },
  { input: "quantum computing", forbidden: [], expectCoverage: "full" },
];

async function profileSummary({ input, forbidden, expectCoverage }) {
  const profile = await buildIndustryProfile(input);
  const scored = scoreCompaniesFromReasoning(
    profile.companies,
    {
      primary_layer: profile.reasoning.bottleneck.primary_layer,
      constraint_type: profile.reasoning.bottleneck.constraint_type,
      sector_signals: profile.reasoning.intent.sector_signals,
    },
    profile.reasoning.company_matches,
  );

  return {
    input,
    run_id: profile.reasoning.structured_report.run_id,
    confidence_level: profile.reasoning.confidence_level,
    layers: profile.reasoning.layers.map((layer) => `${layer.id}:${layer.composite_pressure}`).join("|"),
    bottleneck: profile.reasoning.bottleneck.primary_layer,
    roles: scored
      .slice(0, 5)
      .map((c) => `${c.ticker}:${c.selection_insight?.supply_role_label ?? "?"}`)
      .join(", "),
    top5: scored.slice(0, 5).map((c) => `${c.ticker}:${c.score}`).join(", "),
    audit_fields: profile.reasoning.audit_trail.every(
      (row) => row.why_included && row.why_not_others && row.confidence >= 0 && row.confidence <= 1,
    ),
    all_constrained: profile.reasoning.company_matches.every(
      (match) => match.constraints_met.length > 0,
    ),
    forbidden_hits: scored
      .slice(0, 5)
      .map((company) => company.ticker)
      .filter((ticker) => forbidden.includes(ticker))
      .join(","),
    coverage: profile.reasoning.universe_coverage.level,
    coverage_ok: expectCoverage ? profile.reasoning.universe_coverage.level === expectCoverage : true,
    grounding: profile.interpretation.grounding_mode ?? "none",
    source_count: profile.interpretation.research_sources?.length ?? 0,
  };
}

async function main() {
  const rows = [];
  for (const testCase of cases) {
    rows.push(await profileSummary(testCase));
  }

  console.table(rows);

  const unique = new Set(rows.map((row) => row.top5));
  console.log(`Unique Top-5: ${unique.size}/${rows.length}`);
  console.log(`All audit fields present: ${rows.every((row) => row.audit_fields)}`);
  console.log(`All pass constraint gate: ${rows.every((row) => row.all_constrained)}`);
  console.log(`No obvious cross-sector picks: ${rows.every((row) => !row.forbidden_hits)}`);
  console.log(`Coverage expectations met: ${rows.every((row) => row.coverage_ok)}`);
  console.log(`Rules grounding available for canonical demos: ${rows.filter((row) => row.grounding === "curated_rules").length >= 3}`);

  const repeat = await runReasoningEngine("Semiconductor");
  const repeat2 = await runReasoningEngine("Semiconductor");
  const layerMatch =
    repeat.layers.map((l) => `${l.id}:${l.composite_pressure}`).join("|") ===
    repeat2.layers.map((l) => `${l.id}:${l.composite_pressure}`).join("|");
  const bottleneckMatch = repeat.bottleneck.primary_layer === repeat2.bottleneck.primary_layer;
  const rankingMatch =
    repeat.final_ranking.map((r) => `${r.ticker}:${r.throat_score}`).join(",") ===
    repeat2.final_ranking.map((r) => `${r.ticker}:${r.throat_score}`).join(",");

  console.log(`Deterministic layers: ${layerMatch}`);
  console.log(`Deterministic bottleneck: ${bottleneckMatch}`);
  console.log(`Deterministic ranking: ${rankingMatch}`);

  const ok =
    unique.size >= 4 &&
    rows.every((row) => row.audit_fields && row.all_constrained && !row.forbidden_hits && row.coverage_ok) &&
    layerMatch &&
    bottleneckMatch &&
    rankingMatch;

  process.exit(ok ? 0 : 1);
}

main();
