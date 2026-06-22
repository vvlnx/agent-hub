import sectorHintsSeed from "../../data/catalog-sector-hints.json";
import { loadEquityCatalog, normalizeTicker } from "./catalog";
import { analysisGradeForTicker } from "./resolver";
import type { BitgetDiscoveryEntry, BitgetDiscoveryResult } from "./types";

interface SectorHintsPack {
  hints: Record<string, string[]>;
}

const sectorHintsByTicker = (sectorHintsSeed as SectorHintsPack).hints;

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function matchesHints(entryTicker: string, queryHints: string[]): boolean {
  if (queryHints.length === 0) return false;
  const tickerLower = entryTicker.toLowerCase();
  const catalogHints = sectorHintsByTicker[entryTicker.toUpperCase()] ?? [];

  return queryHints.some((hint) => {
    const h = hint.toLowerCase();
    if (tickerLower.length >= 3 && (tickerLower.includes(h) || h.includes(tickerLower))) {
      return true;
    }
    if (tickerLower.length <= 2 && h === tickerLower) {
      return true;
    }
    return catalogHints.some((catalogHint) => {
      const c = catalogHint.toLowerCase();
      return c.includes(h) || h.includes(c);
    });
  });
}

function hintMatchScore(entryTicker: string, hints: string[]): number {
  let score = 0;
  for (const hint of hints) {
    if (matchesHints(entryTicker, [hint])) score += 1;
  }
  return score;
}

function bestSectorHint(entryTicker: string, hints: string[]): string | undefined {
  for (const hint of hints) {
    if (matchesHints(entryTicker, [hint])) return hint;
  }
  return undefined;
}

export async function discoverBitgetListedCandidates(input: {
  curatedTickers: string[];
  sectorTags: string[];
  keywords: string[];
  limit?: number;
}): Promise<BitgetDiscoveryResult> {
  const limit = input.limit ?? 12;
  const curated = new Set(input.curatedTickers.map(normalizeTicker));
  const hints = [...new Set([...input.sectorTags, ...input.keywords].flatMap(tokenize))].slice(0, 16);
  const { by_ticker, snapshot } = await loadEquityCatalog();

  const entries: BitgetDiscoveryEntry[] = [];

  for (const [ticker, instruments] of by_ticker.entries()) {
    if (curated.has(ticker)) continue;
    const hasListing = instruments.some(
      (instrument) =>
        instrument.product_line === "us_stocks_direct" ||
        (instrument.status === "online" && instrument.listed),
    );
    if (!hasListing) continue;

    const tier =
      instruments.some((instrument) => instrument.tradability === "executable_now")
        ? "A"
        : instruments.some((instrument) => instrument.product_line === "us_stocks_direct")
          ? "B"
          : "C";

    if (tier === "C") continue;

    const sectorHint = bestSectorHint(ticker, hints);
    if (hints.length > 0 && !sectorHint) {
      continue;
    }

    entries.push({
      ticker,
      sector_hint: sectorHint,
      execution_tier: tier,
      in_curated_universe: analysisGradeForTicker(ticker) === "deep",
    });
  }

  entries.sort((a, b) => {
    const hintDiff = hintMatchScore(b.ticker, hints) - hintMatchScore(a.ticker, hints);
    if (hintDiff !== 0) return hintDiff;
    const tierOrder = { A: 0, B: 1, C: 2 } as const;
    const tierDiff = tierOrder[a.execution_tier] - tierOrder[b.execution_tier];
    if (tierDiff !== 0) return tierDiff;
    if (a.in_curated_universe !== b.in_curated_universe) {
      return a.in_curated_universe ? -1 : 1;
    }
    return a.ticker.localeCompare(b.ticker);
  });

  const limited = entries.slice(0, limit);

  return {
    curated_count: curated.size,
    discovery_count: limited.length,
    entries: limited,
    summary_en: `${limited.length} additional Bitget-listed US equity ticker(s) discovered beyond the ${curated.size}-company curated research universe (catalog as of ${snapshot.app_catalog_as_of}).`,
    summary_zh: `在 ${curated.size} 家策展研究库之外，又发现 ${limited.length} 个 Bitget 已覆盖美股标的（catalog 截至 ${snapshot.app_catalog_as_of}）。`,
  };
}

export { normalizeTicker };
