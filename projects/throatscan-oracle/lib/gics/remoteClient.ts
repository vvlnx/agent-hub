import type { GicsClassification } from "./types";
import type { GicsOrgRole, GicsWorkflowPlan } from "./researchTypes";
import { getCatalogEntry, listCompaniesByGicsPrefix } from "./staticCatalog";
import { buildLocalWorkflowPlan, getOrgRolesForGicsCode } from "./workflowTemplates";

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

export function gicsApiBase(): string | null {
  const raw = process.env.GICS_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function isGicsApiConfigured(): boolean {
  return Boolean(gicsApiBase());
}

async function gicsFetchJson<T>(path: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T | null> {
  const base = gicsApiBase();
  if (!base) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
  const unique = [...new Set(tickers.map((t) => t.toUpperCase().trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const body = await gicsFetchJson<RemoteGicsBatchResponse>(
    "/api/companies/classifications",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: unique }),
    },
    timeoutMs,
  );

  if (body?.results) return body.results;

  const fallback: Record<string, RemoteGicsPayload> = {};
  for (const ticker of unique) {
    const entry = getCatalogEntry(ticker);
    if (!entry) continue;
    fallback[ticker] = {
      ticker,
      gics_code: entry.gics_code,
      company_name: entry.company_name,
      description: entry.description,
      classification: entry.classification,
      source: entry.source,
    };
  }
  return fallback;
}

export async function fetchRemoteCompaniesByGicsPrefix(prefix: string): Promise<RemoteGicsPayload[]> {
  const code = prefix.replace(/\D/g, "");
  if (!code) return [];

  const remote = await gicsFetchJson<
    Array<{
      ticker: string;
      name?: string;
      gics_code?: string;
      industry_name_en?: string;
      description?: string;
    }>
  >(`/api/companies?gics_code=${encodeURIComponent(code)}`);

  if (remote?.length) {
    const mapped: RemoteGicsPayload[] = [];
    for (const row of remote) {
      const catalog = getCatalogEntry(row.ticker);
      if (!catalog) continue;
      mapped.push({
        ticker: row.ticker.toUpperCase(),
        gics_code: row.gics_code ?? catalog.gics_code,
        company_name: row.name ?? catalog.company_name,
        description: row.description ?? catalog.description,
        classification: catalog.classification,
        source: "remote",
      });
    }
    if (mapped.length > 0) return mapped;
  }

  return listCompaniesByGicsPrefix(code).map((entry) => ({
    ticker: entry.ticker,
    gics_code: entry.gics_code,
    company_name: entry.company_name,
    description: entry.description,
    classification: entry.classification,
    source: entry.source,
  }));
}

export async function fetchRemoteGicsWorkflow(ticker: string): Promise<GicsWorkflowPlan | null> {
  const remote = await gicsFetchJson<{
    ticker: string;
    name?: string;
    gics_code?: string;
    sector_name?: string;
    system_prompt?: string;
    search_queries?: string[];
  }>(`/api/gics/workflow/${encodeURIComponent(ticker.toUpperCase())}`);

  if (remote?.system_prompt) {
    return {
      ticker: remote.ticker,
      name: remote.name,
      gics_code: remote.gics_code,
      sector_name: remote.sector_name,
      system_prompt: remote.system_prompt,
      search_queries: remote.search_queries ?? [],
      source: "remote",
    };
  }

  const catalog = getCatalogEntry(ticker);
  if (!catalog) return null;
  return buildLocalWorkflowPlan(ticker, catalog.company_name, catalog.gics_code);
}

export async function fetchRemoteGicsOrg(ticker: string): Promise<GicsOrgRole[] | null> {
  const remote = await gicsFetchJson<{
    org_chart?: Array<{
      role_slug: string;
      role_name: string;
      gics_prefix?: string;
      system_prompt_template?: string;
    }>;
  }>(`/api/gics/org/${encodeURIComponent(ticker.toUpperCase())}`);

  if (remote?.org_chart?.length) {
    return remote.org_chart.map((role) => ({
      role_slug: role.role_slug,
      role_name: role.role_name,
      gics_prefix: role.gics_prefix ?? "*",
      system_prompt_template: role.system_prompt_template,
    }));
  }

  const catalog = getCatalogEntry(ticker);
  return catalog ? getOrgRolesForGicsCode(catalog.gics_code) : null;
}

export async function fetchRemoteCompanyReport(
  ticker: string,
): Promise<{ report_md: string; updated_at?: string } | null> {
  const remote = await gicsFetchJson<{ report_md?: string; updated_at?: string }>(
    `/api/reports/${encodeURIComponent(ticker.toUpperCase())}`,
  );
  if (remote?.report_md) return { report_md: remote.report_md, updated_at: remote.updated_at };
  return null;
}
