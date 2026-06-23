import { COMPANY_UNIVERSE } from "../lib/companyUniverse.ts";
import { TICKER_GICS, TICKER_GICS_COUNT, getTickerGics, getTickerGicsSource } from "../lib/gics/tickerMap.ts";
import { GICS_SP500_COUNT, GICS_SP500_EXPORTED_AT } from "../lib/gics/sp500Map.ts";
import { resolveGicsFromQuery } from "../lib/gics/themeMap.ts";
import { DEMO_CANONICAL_INDUSTRIES } from "../lib/universeCoverage.ts";

const universeTickers = COMPANY_UNIVERSE.map((c) => c.ticker);
const missing = universeTickers.filter((ticker) => !getTickerGics(ticker));

if (missing.length > 0) {
  console.error("Missing GICS for universe tickers:", missing.join(", "));
  process.exit(1);
}

const curatedMissing = universeTickers.filter((ticker) => !TICKER_GICS[ticker]);
const sp500Fallback = universeTickers.filter((ticker) => getTickerGicsSource(ticker) === "sp500");

if (TICKER_GICS_COUNT !== universeTickers.length) {
  console.warn(
    `Curated GICS map has ${TICKER_GICS_COUNT} tickers vs universe ${universeTickers.length}; SP500 fallback covers ${sp500Fallback.length} gap(s).`,
  );
}

if (curatedMissing.length > 0 && sp500Fallback.length < curatedMissing.length) {
  console.error("Universe tickers missing both curated and SP500 GICS:", curatedMissing.join(", "));
  process.exit(1);
}

for (const industry of DEMO_CANONICAL_INDUSTRIES) {
  const mapping = resolveGicsFromQuery(industry);
  if (mapping.mapping_kind === "unknown") {
    console.error(`Canonical industry missing GICS theme map: ${industry}`);
    process.exit(1);
  }
}

console.log(
  `GICS verification passed (curated=${TICKER_GICS_COUNT}, sp500=${GICS_SP500_COUNT}, exported=${GICS_SP500_EXPORTED_AT}, themes=${DEMO_CANONICAL_INDUSTRIES.length}).`,
);
