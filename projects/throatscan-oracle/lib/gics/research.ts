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

  const focusResults = await Promise.all(
    focus.map(async (ticker) => {
      const catalog = getCatalogEntry(ticker);
      const company = input.companies.find((row) => row.ticker === ticker);
      const gicsCode = catalog?.gics_code;
      const name = catalog?.company_name ?? company?.name;

      let workflow = await fetchRemoteGicsWorkflow(ticker);
      const tickerWarnings: string[] = [];
      if (!workflow) {
        workflow = buildLocalWorkflowPlan(ticker, name, gicsCode);
        tickerWarnings.push(
          `Workflow for ${ticker} served from local GICS template (remote DB unavailable).`,
        );
      }

      let org = await fetchRemoteGicsOrg(ticker);
      if (!org?.length) {
        org = getOrgRolesForGicsCode(gicsCode);
      }

      const remoteReport = await fetchRemoteCompanyReport(ticker);
      let report: GicsCompanyReport;
      if (remoteReport?.report_md) {
        report = {
          ticker,
          name,
          status: "available",
          report_md: remoteReport.report_md,
          updated_at: remoteReport.updated_at,
          source: "remote",
        };
      } else {
        const classificationPath = company?.gics
          ? formatGicsPath(company.gics, "en")
          : catalog
            ? formatGicsPath(catalog.classification, "en")
            : undefined;
        report = {
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
        };
      }

      return { workflow, org, report, warnings: tickerWarnings };
    }),
  );

  const workflow_plans = focusResults.map((row) => row.workflow);
  const reports = focusResults.map((row) => row.report);
  const org_roles_by_ticker: GicsResearch["org_roles_by_ticker"] = {};
  for (let index = 0; index < focus.length; index += 1) {
    org_roles_by_ticker[focus[index]!] = focusResults[index]!.org;
  }
  warnings.push(...focusResults.flatMap((row) => row.warnings));

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
