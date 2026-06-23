import type { GicsClassification } from "./types";

const DEFAULT_TIMEOUT_MS = 5_000;

export interface RemoteGicsPayload {
  ticker: string;
  gics_code?: string;
  company_name?: string;
  description?: string;
  classification: GicsClassification;
  source?: string;
}

export interface RemoteGicsBatchResponse {
  count: number;
  missing: string[];
  results: Record<string, RemoteGicsPayload>;
}

export interface RemoteGicsHealth {
  ok: boolean;
  service?: string;
  database?: { ok: boolean; error?: string };
  static_map?: { ok: boolean; ticker_count?: number };
}

function gicsApiBase(): string | null {
  const raw = process.env.GICS_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function isGicsApiConfigured(): boolean {
  return Boolean(gicsApiBase());
}

export async function probeGicsApiHealth(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<RemoteGicsHealth & { configured: boolean; latency_ms?: number; error?: string }> {
  const base = gicsApiBase();
  if (!base) {
    return { configured: false, ok: false, error: "GICS_API_URL not set" };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}/api/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    const latency_ms = Date.now() - started;
    if (!response.ok) {
      return {
        configured: true,
        ok: false,
        latency_ms,
        error: `HTTP ${response.status}`,
      };
    }
    const body = (await response.json()) as RemoteGicsHealth;
    return { configured: true, latency_ms, ...body };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      latency_ms: Date.now() - started,
      error: error instanceof Error ? error.message : "GICS API probe failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRemoteGicsBatch(
  tickers: string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Record<string, RemoteGicsPayload>> {
  const base = gicsApiBase();
  if (!base || tickers.length === 0) return {};

  const unique = [...new Set(tickers.map((t) => t.toUpperCase().trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}/api/companies/classifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: unique }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return {};
    const body = (await response.json()) as RemoteGicsBatchResponse;
    return body.results ?? {};
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}
