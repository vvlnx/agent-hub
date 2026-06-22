import { buildIndustryProfile } from "../lib/industryInference.ts";
import { scoreCompaniesFromReasoning } from "../lib/scoring.ts";
import { normalizeIndustryQuery } from "../lib/industryAliases.ts";
import { discoverBitgetListedCandidates } from "../lib/equity/discovery.ts";
import { COMPANY_UNIVERSE } from "../lib/companyUniverse.ts";

const cases = [
  { input: "Space", expectTickers: ["RKLB", "ASTS", "LMT"], forbidden: ["JPM", "KO"] },
  { input: "商业航天", expectTickers: ["RKLB", "ASTS"], forbidden: ["JPM"] },
  { input: "Financials banking", expectTickers: ["JPM", "BAC", "GS"], forbidden: ["RKLB", "NVDA"] },
  { input: "银行金融", expectTickers: ["JPM", "BAC"], forbidden: ["RKLB"] },
  { input: "Healthcare services", expectTickers: ["UNH", "CI", "ELV"], forbidden: ["NVDA", "RKLB"] },
  { input: "医疗服务", expectTickers: ["UNH", "CI"], forbidden: ["NVDA"] },
  { input: "Telecom broadband", expectTickers: ["TMUS", "VZ", "T"], forbidden: ["JPM"] },
  { input: "Logistics shipping", expectTickers: ["FDX", "UPS"], forbidden: ["NVDA"] },
  { input: "Consumer retail", expectTickers: ["NKE", "COST", "WMT"], forbidden: ["NVDA", "RKLB"] },
  { input: "Quantum computing", expectTickers: ["IONQ", "RGTI"], forbidden: ["JPM"] },
  { input: "Cybersecurity", expectTickers: ["PANW", "CRWD", "FTNT"], forbidden: ["XOM"] },
  { input: "Semiconductor", expectTickers: ["NVDA", "TSM", "ASML"], forbidden: ["LLY"] },
  { input: "AI chips", expectTickers: ["NVDA", "AMD"], forbidden: ["LLY"] },
  { input: "EV Battery", expectTickers: ["ALB", "APTV"], forbidden: ["LLY"] },
  { input: "Utilities power grid", expectTickers: ["NEE", "DUK"], forbidden: ["NVDA"] },
  { input: "Media streaming", expectTickers: ["NFLX", "SPOT"], forbidden: ["XOM"] },
];

async function summarize(test) {
  const canonical = normalizeIndustryQuery(test.input);
  const profile = await buildIndustryProfile(test.input);
  const scored = scoreCompaniesFromReasoning(
    profile.companies,
    {
      primary_layer: profile.reasoning.bottleneck.primary_layer,
      constraint_type: profile.reasoning.bottleneck.constraint_type,
      sector_signals: profile.reasoning.intent.sector_signals,
    },
    profile.reasoning.company_matches,
  );
  const top5 = scored.slice(0, 5).map((c) => c.ticker);
  const top5Str = scored.slice(0, 5).map((c) => `${c.ticker}:${c.score}`).join(", ");
  const expectHits = test.expectTickers.filter((t) => top5.includes(t));
  const forbiddenHits = test.forbidden.filter((t) => top5.includes(t));
  const discovery = await discoverBitgetListedCandidates({
    curatedTickers: scored.slice(0, 8).map((c) => c.ticker),
    sectorTags: profile.reasoning.intent.sector_signals,
    keywords: profile.reasoning.intent.sector_signals,
    limit: 8,
  });
  return {
    input: test.input,
    canonical,
    coverage: profile.reasoning.universe_coverage.level,
    matched: profile.reasoning.universe_coverage.matched_count,
    confidence: profile.reasoning.confidence_level,
    top5: top5Str,
    expect: `${expectHits.length}/${test.expectTickers.length}`,
    forbidden: forbiddenHits.join(",") || "—",
    discovery: discovery.entries.slice(0, 4).map((e) => `${e.ticker}(${e.execution_tier})`).join(", ") || "—",
    ok: expectHits.length >= Math.min(2, test.expectTickers.length) && forbiddenHits.length === 0,
  };
}

async function main() {
  console.log(`Universe size: ${COMPANY_UNIVERSE.length}\n`);
  const rows = [];
  for (const testCase of cases) {
    rows.push(await summarize(testCase));
  }
  console.table(rows);
  const pass = rows.filter((row) => row.ok).length;
  console.log(`\nPass: ${pass}/${rows.length}`);
  const fail = rows.filter((row) => !row.ok);
  if (fail.length) {
    console.log("Failures:");
    for (const row of fail) {
      console.log(`  - ${row.input}: top5=[${row.top5}] expect=${row.expect} forbidden=${row.forbidden}`);
    }
  }
  process.exit(pass === rows.length ? 0 : 1);
}

main();
