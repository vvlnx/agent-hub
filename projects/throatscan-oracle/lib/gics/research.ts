import { formatGicsPath } from "./types";
import { getCatalogEntry, listCompaniesByGicsPrefix } from "./staticCatalog";
import {
  fetchRemoteCompanyReport,
  fetchRemoteGicsOrg,
  fetchRemoteGicsWorkflow,
  gicsApiBase,
  isGicsApiConfigured,
} from "./remoteClient";
import { resolveGicsFromQueryAsync } from "./queryResolver";
import type { GicsResearch, GicsCompanyReport } from "./researchTypes";
import {
  buildLocalWorkflowPlan,
  buildStubReportMarkdown,
  getOrgRolesForGicsCode,
} from "./workflowTemplates";
import type { Company } from "../types";

export async function buildGicsResearch(input: {
  industryQuery: string;
  companies: Company[];
  focusTickers?: string[];
}): Promise<GicsResearch> {
  const warnings: string[] = [];
  const query_mapping = await resolveGicsFromQueryAsync(input.industryQuery);
  const prefix = query_mapping.gics_code_prefix || query_mapping.gics_code?.slice(0, 6) || "45";
  const peers = listCompaniesByGicsPrefix(prefix, 80);
  const peer_tickers = peers.map((peer) => peer.ticker);

  const focus = (
    input.focusTickers?.length
      ? input.focusTickers
      : input.companies.slice(0, 3).map((company) => company.ticker)
  ).slice(0, 3);

  const workflow_plans = [];
  const reports: GicsCompanyReport[] = [];
  const org_roles_by_ticker: GicsResearch["org_roles_by_ticker"] = {};

  for (const ticker of focus) {
    const catalog = getCatalogEntry(ticker);
    const company = input.companies.find((row) => row.ticker === ticker);
    const gicsCode = catalog?.gics_code;
    const name = catalog?.company_name ?? company?.name;

    let workflow = await fetchRemoteGicsWorkflow(ticker);
    if (!workflow) {
      workflow = buildLocalWorkflowPlan(ticker, name, gicsCode);
      warnings.push(`Workflow for ${ticker} served from local GICS template (remote DB unavailable).`);
    }
    workflow_plans.push(workflow);

    let org = await fetchRemoteGicsOrg(ticker);
    if (!org?.length) {
      org = getOrgRolesForGicsCode(gicsCode);
    }
    org_roles_by_ticker[ticker] = org;

    const remoteReport = await fetchRemoteCompanyReport(ticker);
    if (remoteReport?.report_md) {
      reports.push({
        ticker,
        name,
        status: "available",
        report_md: remoteReport.report_md,
        updated_at: remoteReport.updated_at,
        source: "remote",
      });
    } else {
      const classificationPath = company?.gics
        ? formatGicsPath(company.gics, "en")
        : catalog
          ? formatGicsPath(catalog.classification, "en")
          : undefined;
      reports.push({
        ticker,
        name,
        status: "missing",
        report_md: buildStubReportMarkdown({
          ticker,
          name,
          gicsCode,
          classificationPath,
          workflow,
        }),
        source: "generated_stub",
      });
    }
  }

  const tools_used = [
    "get_company_classification",
    "get_companies_by_gics",
    "batch_classifications",
    "get_gics_workflow",
    "get_gics_org",
    "get_company_report",
  ];

  if (!isGicsApiConfigured()) {
    warnings.push("GICS_API_URL not set — using static SP500 catalog + local workflow templates.");
  }

  return {
    enabled: true,
    channel: "gics_http_mcp",
    api_url: gicsApiBase() ?? undefined,
    tools_used,
    query_mapping,
    gics_code_prefix: prefix,
    peer_tickers,
    peer_count: peer_tickers.length,
    reports,
    workflow_plans,
    org_roles_by_ticker,
    fetched_at: new Date().toISOString(),
    warnings,
  };
}
