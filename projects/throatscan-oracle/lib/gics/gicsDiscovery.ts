import { loadEquityCatalog, normalizeTicker } from "../equity/catalog";
import { analysisGradeForTicker } from "../equity/resolver";
import type { BitgetDiscoveryEntry, BitgetDiscoveryResult } from "../equity/types";
import { listCompaniesByGicsPrefix } from "./staticCatalog";

export interface GicsDiscoveryResult extends BitgetDiscoveryResult {
  gics_code_prefix: string;
  gics_peers_scanned: number;
  discovery_source: "gics_prefix";
}

export async function discoverBitgetCandidatesByGicsPrefix(input: {
  gicsCodePrefix: string;
  curatedTickers: string[];
  limit?: number;
}): Promise<GicsDiscoveryResult> {
  const limit = input.limit ?? 16;
  const prefix = input.gicsCodePrefix.replace(/\D/g, "").slice(0, 6);
  const curated = new Set(input.curatedTickers.map(normalizeTicker));
  const peers = listCompaniesByGicsPrefix(prefix, 400);
  const { by_ticker } = await loadEquityCatalog();

  const entries: BitgetDiscoveryEntry[] = [];

  for (const peer of peers) {
    const ticker = normalizeTicker(peer.ticker);
    if (curated.has(ticker)) continue;

    const instruments = by_ticker.get(ticker);
    if (!instruments?.length) continue;

    const hasListing = instruments.some(
      (instrument) =>
        instrument.product_line === "us_stocks_direct" ||
        (instrument.status === "online" && instrument.listed),
    );
    if (!hasListing) continue;

    const tier = instruments.some((instrument) => instrument.tradability === "executable_now")
      ? "A"
      : instruments.some((instrument) => instrument.product_line === "us_stocks_direct")
        ? "B"
        : "C";

    if (tier === "C") continue;

    entries.push({
      ticker,
      name: peer.company_name,
      sector_hint: `GICS ${prefix}`,
      gics_code: peer.gics_code,
      discovery_via: "gics_prefix",
      execution_tier: tier,
      in_curated_universe: analysisGradeForTicker(ticker) === "deep",
    });
  }

  entries.sort((a, b) => {
    const tierOrder = { A: 0, B: 1, C: 2 } as const;
    const tierDiff = tierOrder[a.execution_tier] - tierOrder[b.execution_tier];
    if (tierDiff !== 0) return tierDiff;
    return a.ticker.localeCompare(b.ticker);
  });

  const limited = entries.slice(0, limit);

  return {
    curated_count: curated.size,
    discovery_count: limited.length,
    entries: limited,
    gics_code_prefix: prefix,
    gics_peers_scanned: peers.length,
    discovery_source: "gics_prefix",
    summary_en: `${limited.length} Bitget-listed peer(s) found under GICS prefix ${prefix} (${peers.length} catalog peers scanned, beyond ${curated.size} curated names).`,
    summary_zh: `在 GICS 前缀 ${prefix} 下发现 ${limited.length} 个 Bitget 已覆盖同业标的（扫描 ${peers.length} 个目录同业，策展库 ${curated.size} 家）。`,
  };
}

export function mergeDiscoveryResults(
  hintResult: BitgetDiscoveryResult,
  gicsResult: GicsDiscoveryResult,
  limit = 20,
): BitgetDiscoveryResult & { gics_code_prefix?: string; gics_peers_scanned?: number } {
  const seen = new Set<string>();
  const merged: BitgetDiscoveryEntry[] = [];

  for (const entry of [...gicsResult.entries, ...hintResult.entries]) {
    if (seen.has(entry.ticker)) continue;
    seen.add(entry.ticker);
    merged.push(entry);
  }

  return {
    curated_count: hintResult.curated_count,
    discovery_count: Math.min(merged.length, limit),
    entries: merged.slice(0, limit),
    gics_code_prefix: gicsResult.gics_code_prefix,
    gics_peers_scanned: gicsResult.gics_peers_scanned,
    summary_en: `${merged.slice(0, limit).length} Bitget-listed discovery name(s): ${gicsResult.discovery_count} via GICS prefix ${gicsResult.gics_code_prefix}, ${hintResult.discovery_count} via sector hints.`,
    summary_zh: `共 ${merged.slice(0, limit).length} 个 Bitget 发现标的：${gicsResult.discovery_count} 个来自 GICS 前缀 ${gicsResult.gics_code_prefix}，${hintResult.discovery_count} 个来自行业关键词。`,
  };
}
