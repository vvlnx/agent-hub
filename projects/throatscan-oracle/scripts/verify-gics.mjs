import { COMPANY_UNIVERSE } from "../lib/companyUniverse.ts";
import { TICKER_GICS, TICKER_GICS_COUNT } from "../lib/gics/tickerMap.ts";
import { resolveGicsFromQuery } from "../lib/gics/themeMap.ts";
import { DEMO_CANONICAL_INDUSTRIES } from "../lib/universeCoverage.ts";

const universeTickers = COMPANY_UNIVERSE.map((c) => c.ticker);
const missing = universeTickers.filter((ticker) => !TICKER_GICS[ticker]);

if (missing.length > 0) {
  console.error("Missing GICS for universe tickers:", missing.join(", "));
  process.exit(1);
}

if (TICKER_GICS_COUNT !== universeTickers.length) {
  console.error(
    `Ticker GICS count mismatch: map=${TICKER_GICS_COUNT}, universe=${universeTickers.length}`,
  );
  process.exit(1);
}

for (const industry of DEMO_CANONICAL_INDUSTRIES) {
  const mapping = resolveGicsFromQuery(industry);
  if (mapping.mapping_kind === "unknown") {
    console.error(`Canonical industry missing GICS theme map: ${industry}`);
    process.exit(1);
  }
}

console.log(`GICS verification passed (${TICKER_GICS_COUNT} tickers, ${DEMO_CANONICAL_INDUSTRIES.length} themes).`);
