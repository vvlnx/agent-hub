/**
 * Deterministic helpers — same normalized input must yield reproducible structure and ranking.
 */

export function normalizeInputKey(rawInput: string): string {
  return rawInput.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashInputKey(key: string): string {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function stableRound(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function isConstrainedLlmEnabled(): boolean {
  return process.env.THROATSCAN_LLM?.trim() === "1";
}
