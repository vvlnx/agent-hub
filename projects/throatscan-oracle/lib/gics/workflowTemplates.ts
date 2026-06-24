import type { GicsOrgRole, GicsWorkflowPlan } from "./researchTypes";

const GENERIC_EMPLOYEES: GicsOrgRole[] = [
  {
    role_slug: "ceo",
    role_name: "Chief Strategy Officer (CEO)",
    gics_prefix: "*",
    system_prompt_template:
      "Synthesize financial, compliance, and sector expert inputs into an investor-grade GICS-aligned thesis.",
  },
  {
    role_slug: "cfo",
    role_name: "Financial Analyst (CFO)",
    gics_prefix: "*",
    system_prompt_template:
      "Analyze profitability quality, valuation multiples, and capital efficiency from filings and market data.",
  },
  {
    role_slug: "cro",
    role_name: "Compliance & Risk Officer (CRO)",
    gics_prefix: "*",
    system_prompt_template:
      "Stress-test macro, regulatory, and substitution risks against the current bottleneck thesis.",
  },
];

const PREFIX_EMPLOYEES: GicsOrgRole[] = [
  {
    role_slug: "semi_expert",
    role_name: "Semiconductor Process Expert",
    gics_prefix: "4530",
    system_prompt_template:
      "Audit process nodes, advanced packaging, foundry utilization, and developer ecosystem moats.",
  },
  {
    role_slug: "software_expert",
    role_name: "SaaS Metrics Expert",
    gics_prefix: "4510",
    system_prompt_template:
      "Audit ARR, NDR, LTV/CAC, and switching-cost moats for application software names.",
  },
  {
    role_slug: "consumer_expert",
    role_name: "Consumer Brand Expert",
    gics_prefix: "30",
    system_prompt_template:
      "Audit brand premium, channel mix, input-cost cycles, and repeat purchase behavior.",
  },
];

export function getOrgRolesForGicsCode(gicsCode?: string): GicsOrgRole[] {
  const matched = PREFIX_EMPLOYEES.filter(
    (role) => gicsCode && gicsCode.startsWith(role.gics_prefix),
  );
  return [...GENERIC_EMPLOYEES, ...matched];
}

export function buildLocalWorkflowPlan(
  ticker: string,
  name: string | undefined,
  gicsCode: string | undefined,
): GicsWorkflowPlan {
  const roles = getOrgRolesForGicsCode(gicsCode);
  const sectorRole = roles.find((role) => role.gics_prefix !== "*");
  const sector_name = sectorRole?.role_name ?? "General equity research";

  return {
    ticker,
    name,
    gics_code: gicsCode,
    sector_name,
    system_prompt: sectorRole?.system_prompt_template ?? GENERIC_EMPLOYEES[0].system_prompt_template,
    search_queries: [
      `${ticker} SEC 10-K risk factors capacity customers`,
      `${ticker} ${name ?? ""} supply chain bottleneck evidence`.trim(),
      `${ticker} Bitget stock token tradability`,
    ],
    source: "local_template",
  };
}

export function buildStubReportMarkdown(input: {
  ticker: string;
  name?: string;
  gicsCode?: string;
  classificationPath?: string;
  workflow: GicsWorkflowPlan;
}): string {
  return [
    `# GICS Research Stub — ${input.ticker}`,
    "",
    `> Auto-generated from GICS classification metadata. Full batch report not yet available from GICS_industry DB.`,
    "",
    `- **Company:** ${input.name ?? input.ticker}`,
    `- **GICS code:** ${input.gicsCode ?? "—"}`,
    `- **Classification:** ${input.classificationPath ?? "—"}`,
    `- **Sector workflow:** ${input.workflow.sector_name ?? "General"}`,
    "",
    "## Suggested verification queries",
    ...input.workflow.search_queries.map((query) => `- ${query}`),
    "",
    "## Next step",
    "Run GICS_industry batch_manager against this ticker to replace this stub with a full markdown report.",
  ].join("\n");
}
