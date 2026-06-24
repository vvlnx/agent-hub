import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = join(projectRoot, "data/bitget-us-stocks-app-universe.json");
const BITGET_INSTRUMENTS_URL = "https://api.bitget.com/api/v3/market/instruments?category=SPOT";

function extractTicker(baseCoin, symbol) {
  if (baseCoin.startsWith("r") && baseCoin.length > 1) {
    return baseCoin.slice(1).toUpperCase();
  }
  if (symbol.toUpperCase().endsWith("ONUSDT")) {
    return symbol.slice(0, -"ONUSDT".length).toUpperCase();
  }
  return null;
}

const write = process.argv.includes("--write");

const response = await fetch(BITGET_INSTRUMENTS_URL);
if (!response.ok) {
  console.error(`Bitget instruments request failed: HTTP ${response.status}`);
  process.exit(1);
}

const payload = await response.json();
if (payload.code !== "00000") {
  console.error(`Bitget instruments error: ${payload.code} ${payload.msg}`);
  process.exit(1);
}

const liveStockTickers = [
  ...new Set(
    payload.data
      .filter((row) => row.symbolType === "stock" && row.status === "online")
      .map((row) => extractTicker(row.baseCoin, row.symbol))
      .filter(Boolean),
  ),
].sort();

const seed = JSON.parse(readFileSync(seedPath, "utf8"));
const seedTickers = [...new Set(seed.tickers.map((ticker) => ticker.toUpperCase()))].sort();

const onlyLive = liveStockTickers.filter((ticker) => !seedTickers.includes(ticker));
const onlySeed = seedTickers.filter((ticker) => !liveStockTickers.includes(ticker));

console.log(`Live Bitget stock tickers (online): ${liveStockTickers.length}`);
console.log(`App universe seed tickers: ${seedTickers.length}`);
console.log(`In live API but not seed: ${onlyLive.length}`);
console.log(`In seed but not live stock API: ${onlySeed.length}`);

if (onlyLive.length > 0) {
  console.log("\nSample live-only tickers:");
  console.log(onlyLive.slice(0, 20).join(", "));
}

if (onlySeed.length > 0) {
  console.log("\nSample seed-only tickers:");
  console.log(onlySeed.slice(0, 20).join(", "));
}

if (write) {
  const nextSeed = {
    source: "bitget_v3_instruments_sync",
    as_of: new Date().toISOString().slice(0, 10),
    product: "us_stocks_direct",
    note_en: "Tier B App catalog synced from Bitget v3 SPOT instruments (symbolType=stock, status=online).",
    note_zh: "Tier B App catalog 已与 Bitget v3 SPOT instruments 同步（symbolType=stock，status=online）。",
    tickers: liveStockTickers,
  };
  writeFileSync(seedPath, `${JSON.stringify(nextSeed, null, 2)}\n`);
  console.log(`\nWrote ${liveStockTickers.length} tickers to ${seedPath}`);
} else {
  console.log("\nDry run only. Pass --write to refresh data/bitget-us-stocks-app-universe.json");
}
