import { buildIndustryProfile } from "../lib/industryInference.ts";
import { scoreCompaniesFromReasoning } from "../lib/scoring.ts";
import { discoverBitgetListedCandidates } from "../lib/equity/discovery.ts";
import { COMPANY_UNIVERSE } from "../lib/companyUniverse.ts";

const queries = [
  "Space",
  "商业航天",
  "Financials banking",
  "Healthcare services",
  "Telecom broadband",
  "Logistics shipping",
  "Consumer retail",
  "Media streaming",
  "Quantum computing",
  "Cybersecurity",
  "Semiconductor",
  "AI chips",
  "EV Battery",
  "Utilities power grid",
  "Oil and Gas",
  "Biotech",
];

async function runQuery(input) {
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
  const rolePicks = profile.reasoning.company_matches.map((m) => m.ticker).join(", ");
  const top10 = scored.slice(0, 10).map((c) => c.ticker).join(", ");
  const discovery = await discoverBitgetListedCandidates({
    curatedTickers: scored.slice(0, 8).map((c) => c.ticker),
    sectorTags: profile.reasoning.intent.sector_signals,
    keywords: profile.reasoning.intent.sector_signals,
    limit: 6,
  });
  return {
    input,
    coverage: profile.reasoning.universe_coverage.level,
    matched: profile.reasoning.universe_coverage.matched_count,
    role_picks: rolePicks || "—",
    top10,
    discovery: discovery.entries.map((e) => `${e.ticker}${e.execution_tier}`).join(", ") || "—",
  };
}

async function main() {
  console.log(`Research universe: ${COMPANY_UNIVERSE.length} companies\n`);
  const rows = [];
  for (const query of queries) rows.push(await runQuery(query));
  console.table(rows);
}

main();
