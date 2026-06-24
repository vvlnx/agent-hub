import type { GicsQueryMapping } from "./types";

export interface GicsCompanyReport {
  ticker: string;
  name?: string;
  status: "available" | "missing" | "error";
  report_md?: string;
  updated_at?: string;
  source: "remote" | "generated_stub";
}

export interface GicsWorkflowPlan {
  ticker: string;
  name?: string;
  gics_code?: string;
  sector_name?: string;
  system_prompt?: string;
  search_queries: string[];
  source: "remote" | "local_template";
}

export interface GicsOrgRole {
  role_slug: string;
  role_name: string;
  gics_prefix: string;
  system_prompt_template?: string;
}

export interface GicsResearch {
  enabled: boolean;
  channel: "gics_http_mcp";
  api_url?: string;
  tools_used: string[];
  query_mapping: GicsQueryMapping;
  gics_code_prefix: string;
  peer_tickers: string[];
  peer_count: number;
  reports: GicsCompanyReport[];
  workflow_plans: GicsWorkflowPlan[];
  org_roles_by_ticker: Record<string, GicsOrgRole[]>;
  fetched_at: string;
  warnings: string[];
}
