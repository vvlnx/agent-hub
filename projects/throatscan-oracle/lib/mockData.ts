import type {
  Company,
  CompanyBreakdown,
  ThroatRole,
  ThroatScanConclusion,
  WhyBottleneckOrNot,
} from "./types";
import { normalizeCompany } from "./types";
import type { BacktestValidation } from "./backtest";

export type { Company, CompanyBreakdown, ThroatRole, WhyBottleneckOrNot };
export type { BacktestValidation };

export interface ChainNode {
  name: string;
  description: string;
  stage: "upstream" | "midstream" | "downstream";
}

export interface CompanySeed {
  name: string;
  ticker: string;
  chain_position: string;
  throat_role: ThroatRole;
  why_bottleneck_or_not: WhyBottleneckOrNot;
  breakdown: Partial<CompanyBreakdown>;
}

export type IndustryId = "Semiconductors" | "AI Data Centers" | "Cloud Software";

export interface IndustryPreset {
  id: IndustryId;
  summary: string;
  bottleneck_location: string;
  primary_bottleneck_ticker: string;
  chain: ChainNode[];
  companies: CompanySeed[];
}

export interface AnalysisResult {
  industry: IndustryId;
  summary: string;
  chain: ChainNode[];
  companies: Company[];
  conclusion: ThroatScanConclusion;
  backtest: BacktestValidation;
  analyzedAt: string;
}

export const DEFAULT_INDUSTRY: IndustryId = "Semiconductors";

export const INDUSTRY_ALIASES: Record<string, IndustryId> = {
  semiconductors: "Semiconductors",
  semiconductor: "Semiconductors",
  chips: "Semiconductors",
  "ai data centers": "AI Data Centers",
  "ai data center": "AI Data Centers",
  "data centers": "AI Data Centers",
  "data center": "AI Data Centers",
  "cloud software": "Cloud Software",
  saas: "Cloud Software",
  cloud: "Cloud Software",
};

function why(
  scarce_resource: string,
  can_function_without: string,
  replaceability_1_to_3_years: string,
): WhyBottleneckOrNot {
  return { scarce_resource, can_function_without, replaceability_1_to_3_years };
}

function seed(
  ticker: string,
  name: string,
  chain_position: string,
  throat_role: ThroatRole,
  why_bottleneck_or_not: WhyBottleneckOrNot,
  breakdown: Partial<CompanyBreakdown>,
): CompanySeed {
  return {
    ticker,
    name,
    chain_position,
    throat_role,
    why_bottleneck_or_not,
    breakdown,
  };
}

export const INDUSTRY_PRESETS: Record<IndustryId, IndustryPreset> = {
  Semiconductors: {
    id: "Semiconductors",
    summary:
      "ThroatScan identifies where wafer tools, advanced packaging, and accelerator allocation bind the semiconductor supply chain.",
    bottleneck_location: "Fabless Design — AI accelerator allocation layer",
    primary_bottleneck_ticker: "NVDA",
    chain: [
      {
        name: "EDA & IP",
        description: "Design entry point — limited vendors gate every advanced tape-out",
        stage: "upstream",
      },
      {
        name: "Wafer Fab Equipment",
        description: "Etch/deposition/lithography tools with multi-quarter lead times",
        stage: "upstream",
      },
      {
        name: "Foundry & IDM",
        description: "Advanced-node wafer starts — the physical throughput ceiling",
        stage: "midstream",
      },
      {
        name: "Fabless Design",
        description: "Accelerator and networking silicon that sets downstream demand",
        stage: "midstream",
      },
      {
        name: "Packaging & Test",
        description: "CoWoS, HBM stacking, and OSAT capacity for AI packages",
        stage: "downstream",
      },
    ],
    companies: [
      seed(
        "NVDA",
        "NVIDIA",
        "Fabless Design — AI accelerator orchestration layer",
        "CORE BOTTLENECK",
        why(
          "Controls scarce H100/B200 GPU allocation and CUDA software stack access.",
          "Hyperscale AI training cannot run at planned scale without NVIDIA-class accelerators today.",
          "Partial alternatives (AMD, custom ASIC) emerge in 2–3 years but cannot fully replace software + supply depth.",
        ),
        {
          bottleneck_strength: 96,
          supply_chain_control: 94,
          replaceability: 14,
          industry_dependency: 92,
        },
      ),
      seed(
        "AMAT",
        "Applied Materials",
        "Wafer Fab Equipment — deposition and materials engineering",
        "STRATEGIC ENABLER",
        why(
          "Owns critical deposition and materials steps with long install-base lock-in.",
          "Fabs can slow ramps without AMAT tools, but multiple WFE vendors share the chain.",
          "Tooling mix can shift across vendors over 2–3 years; not a single-vendor software choke.",
        ),
        {
          bottleneck_strength: 86,
          supply_chain_control: 88,
          replaceability: 32,
          industry_dependency: 78,
        },
      ),
      seed(
        "LRCX",
        "Lam Research",
        "Wafer Fab Equipment — etch and deposition systems",
        "STRATEGIC ENABLER",
        why(
          "Etch capacity is concentrated and required for advanced 3D structures.",
          "Node transitions stall if etch throughput is unavailable, yet fabs can dual-source over time.",
          "Replaceable in portions of the fab line within 2–3 years with planning and qualification cycles.",
        ),
        {
          bottleneck_strength: 84,
          supply_chain_control: 85,
          replaceability: 35,
          industry_dependency: 76,
        },
      ),
      seed(
        "KLAC",
        "KLA Corporation",
        "Wafer Fab Equipment — process control and inspection",
        "STRATEGIC ENABLER",
        why(
          "Inspection tools protect yield on expensive wafers but are not single-source for all steps.",
          "Fabs lose yield without metrology, yet production continues at lower efficiency.",
          "Competitive inspection vendors and reuse extend replaceability inside 1–3 years.",
        ),
        {
          bottleneck_strength: 78,
          supply_chain_control: 80,
          replaceability: 42,
          industry_dependency: 72,
        },
      ),
      seed(
        "AVGO",
        "Broadcom",
        "Fabless Design — custom ASIC and networking silicon",
        "STRATEGIC ENABLER",
        why(
          "Important in custom AI ASIC and networking niches with design lock-in.",
          "Broader AI buildout proceeds without any single Broadcom SKU.",
          "Hyperscale programs can re-architect away from specific Broadcom parts in 2–3 years.",
        ),
        {
          bottleneck_strength: 76,
          supply_chain_control: 74,
          replaceability: 38,
          industry_dependency: 70,
        },
      ),
      seed(
        "AMD",
        "Advanced Micro Devices",
        "Fabless Design — GPU/CPU alternative path",
        "DOWNSTREAM USER",
        why(
          "Consumes the same fab, packaging, and HBM capacity as the broader chain.",
          "Acts as relief valve for GPU demand but does not control upstream scarce tools.",
          "Already substituting for NVIDIA in select workloads; replaceability of AMD itself is high.",
        ),
        {
          bottleneck_strength: 68,
          supply_chain_control: 58,
          replaceability: 48,
          industry_dependency: 74,
        },
      ),
      seed(
        "QCOM",
        "Qualcomm",
        "Fabless Design — mobile and edge connectivity",
        "PERIPHERAL EXPOSURE",
        why(
          "No scarce resource central to hyperscale AI accelerator supply.",
          "AI data-center and advanced-node cycles function without Qualcomm participation.",
          "Highly replaceable across mobile and edge vendors within 1–3 years.",
        ),
        {
          bottleneck_strength: 52,
          supply_chain_control: 48,
          replaceability: 72,
          industry_dependency: 44,
        },
      ),
      seed(
        "MRVL",
        "Marvell Technology",
        "Fabless Design — data infrastructure PHY and custom silicon",
        "PERIPHERAL EXPOSURE",
        why(
          "Participates in networking silicon without controlling allocation of scarce AI GPUs or WFE.",
          "Supply chain continues if Marvell slots are substituted in networking designs.",
          "Design wins rotate among networking silicon vendors within 1–3 years.",
        ),
        {
          bottleneck_strength: 48,
          supply_chain_control: 44,
          replaceability: 68,
          industry_dependency: 40,
        },
      ),
    ],
  },
  "AI Data Centers": {
    id: "AI Data Centers",
    summary:
      "ThroatScan traces AI cluster deployment from accelerator allocation through fabric bandwidth and site power constraints.",
    bottleneck_location: "AI Compute Silicon — GPU/accelerator shipment gate",
    primary_bottleneck_ticker: "NVDA",
    chain: [
      {
        name: "AI Compute Silicon",
        description: "GPU/accelerator supply sets the primary cluster throughput ceiling",
        stage: "upstream",
      },
      {
        name: "Server & Rack Systems",
        description: "Integration layer translating silicon into deployable AI racks",
        stage: "midstream",
      },
      {
        name: "Networking Fabric",
        description: "Scale-out bandwidth — congestion here caps effective cluster size",
        stage: "midstream",
      },
      {
        name: "Power & Thermal",
        description: "PDU, UPS, and liquid cooling — physical site-level choke points",
        stage: "downstream",
      },
      {
        name: "Colocation & Infrastructure",
        description: "Power-dense floor space and cross-connect availability",
        stage: "downstream",
      },
    ],
    companies: [
      seed(
        "NVDA",
        "NVIDIA",
        "AI Compute Silicon — cluster throughput governor",
        "CORE BOTTLENECK",
        why(
          "Controls scarce GPU shipments that every large training cluster schedules around.",
          "Clusters cannot reach designed FLOPs without allocated NVIDIA accelerators.",
          "AMD and custom silicon reduce but do not remove dependence within 1–3 years.",
        ),
        {
          bottleneck_strength: 98,
          supply_chain_control: 96,
          replaceability: 12,
          industry_dependency: 94,
        },
      ),
      seed(
        "ANET",
        "Arista Networks",
        "Networking Fabric — AI cluster scale-out switching",
        "STRATEGIC ENABLER",
        why(
          "High-radix switches are scarce for large AI fabrics but not as single-vendor as GPUs.",
          "Clusters can deploy at reduced scale or alternate topologies without Arista specifically.",
          "Switch vendors and architectures can be qualified on a 2–3 year migration path.",
        ),
        {
          bottleneck_strength: 82,
          supply_chain_control: 80,
          replaceability: 40,
          industry_dependency: 78,
        },
      ),
      seed(
        "VRT",
        "Vertiv",
        "Power & Thermal — liquid cooling and rack power distribution",
        "STRATEGIC ENABLER",
        why(
          "Liquid cooling and PDUs are required for dense racks but sourced from multiple vendors.",
          "Deployment slows without thermal capacity; it does not halt accelerator production itself.",
          "Facility vendors are interchangeable over 1–3 years with engineering lead time.",
        ),
        {
          bottleneck_strength: 74,
          supply_chain_control: 70,
          replaceability: 46,
          industry_dependency: 68,
        },
      ),
      seed(
        "SMCI",
        "Super Micro Computer",
        "Server & Rack Systems — AI rack integration and ODM supply",
        "DOWNSTREAM USER",
        why(
          "Integrates upstream silicon into racks without owning scarce compute allocation.",
          "Other ODMs and hyperscale self-builds can absorb rack integration demand.",
          "ODM share shifts within 1–2 years; SMCI is not a structural choke point.",
        ),
        {
          bottleneck_strength: 62,
          supply_chain_control: 55,
          replaceability: 58,
          industry_dependency: 66,
        },
      ),
      seed(
        "AMD",
        "Advanced Micro Devices",
        "AI Compute Silicon — secondary accelerator path",
        "DOWNSTREAM USER",
        why(
          "Provides alternative GPUs but still consumes upstream fab, HBM, and packaging capacity.",
          "Relieves NVIDIA pressure yet does not control the primary allocation throat.",
          "Already acting as substitute; further share gains expected within 1–3 years.",
        ),
        {
          bottleneck_strength: 66,
          supply_chain_control: 60,
          replaceability: 44,
          industry_dependency: 72,
        },
      ),
      seed(
        "EQIX",
        "Equinix",
        "Colocation & Infrastructure — interconnection and floor space",
        "PERIPHERAL EXPOSURE",
        why(
          "Floor space and cross-connect are localized constraints, not industry-wide scarce resources.",
          "AI buildout continues across multiple colocation and cloud regions without Equinix specifically.",
          "Site selection rotates among operators within 1–3 years.",
        ),
        {
          bottleneck_strength: 46,
          supply_chain_control: 42,
          replaceability: 74,
          industry_dependency: 38,
        },
      ),
      seed(
        "DELL",
        "Dell Technologies",
        "Server & Rack Systems — enterprise and hyperscale servers",
        "PERIPHERAL EXPOSURE",
        why(
          "Server assembly is competitive and does not gate accelerator wafer or GPU allocation.",
          "Hyperscale and ODM channels operate without Dell-specific dependence.",
          "Vendor rotation for server supply is routine within 1–2 years.",
        ),
        {
          bottleneck_strength: 42,
          supply_chain_control: 38,
          replaceability: 76,
          industry_dependency: 36,
        },
      ),
    ],
  },
  "Cloud Software": {
    id: "Cloud Software",
    summary:
      "ThroatScan maps digital bottlenecks where identity, data gravity, and control planes gate enterprise AI deployment.",
    bottleneck_location: "Hyperscale Infrastructure — cloud identity and control plane",
    primary_bottleneck_ticker: "MSFT",
    chain: [
      {
        name: "Hyperscale Infrastructure",
        description: "Compute, identity, and developer control planes that anchor workloads",
        stage: "upstream",
      },
      {
        name: "Data & Security Platforms",
        description: "Telemetry, data gravity, and zero-trust enforcement layers",
        stage: "midstream",
      },
      {
        name: "Workflow Applications",
        description: "Business process systems with high switching friction",
        stage: "downstream",
      },
    ],
    companies: [
      seed(
        "MSFT",
        "Microsoft",
        "Hyperscale Infrastructure — Azure, M365, and identity control plane",
        "CORE BOTTLENECK",
        why(
          "Controls enterprise identity, Azure tenancy, and Copilot deployment paths for most Fortune workloads.",
          "Large enterprises cannot migrate AI production workloads quickly off Microsoft identity and M365 gravity.",
          "Multi-cloud strategies reduce but do not eliminate dependence within 1–3 years.",
        ),
        {
          bottleneck_strength: 92,
          supply_chain_control: 90,
          replaceability: 18,
          industry_dependency: 94,
        },
      ),
      seed(
        "ORCL",
        "Oracle",
        "Hyperscale Infrastructure — database and OCI anchor workloads",
        "STRATEGIC ENABLER",
        why(
          "Database estates create migration friction in Oracle-heavy enterprises.",
          "General AI cloud deployment proceeds without Oracle-specific control of identity or GPU access.",
          "Database and cloud substitution is painful but feasible over a 2–3 year horizon.",
        ),
        {
          bottleneck_strength: 72,
          supply_chain_control: 70,
          replaceability: 44,
          industry_dependency: 68,
        },
      ),
      seed(
        "NOW",
        "ServiceNow",
        "Workflow Applications — IT and enterprise service workflows",
        "DOWNSTREAM USER",
        why(
          "Embedded in IT workflows but does not control cloud compute or identity provisioning.",
          "AI infrastructure runs without ServiceNow; it orchestrates tickets and processes downstream.",
          "Workflow platform replacements occur over 2–3 years in large IT refresh cycles.",
        ),
        {
          bottleneck_strength: 58,
          supply_chain_control: 52,
          replaceability: 50,
          industry_dependency: 56,
        },
      ),
      seed(
        "CRWD",
        "CrowdStrike",
        "Data & Security Platforms — endpoint and identity security layer",
        "STRATEGIC ENABLER",
        why(
          "Endpoint agents are sticky for security compliance but not scarce like cloud identity.",
          "Workloads can run with alternate EDR vendors after migration windows.",
          "Security vendor swaps are planned on 1–3 year enterprise cycles.",
        ),
        {
          bottleneck_strength: 62,
          supply_chain_control: 58,
          replaceability: 52,
          industry_dependency: 54,
        },
      ),
      seed(
        "CRM",
        "Salesforce",
        "Workflow Applications — CRM and customer data gravity",
        "DOWNSTREAM USER",
        why(
          "CRM data gravity is account-level, not an industry-wide scarce AI resource.",
          "Semiconductor and data-center supply chains are unaffected by Salesforce availability.",
          "CRM alternatives and modular SaaS stacks are available within 1–3 years.",
        ),
        {
          bottleneck_strength: 48,
          supply_chain_control: 44,
          replaceability: 62,
          industry_dependency: 42,
        },
      ),
      seed(
        "SNOW",
        "Snowflake",
        "Data & Security Platforms — cloud data warehouse gravity",
        "PERIPHERAL EXPOSURE",
        why(
          "Data warehouse layer is substitutable among cloud analytics platforms.",
          "AI compute and cloud identity bottlenecks bind before warehouse selection does.",
          "Analytics stack migration typically completes within 1–3 years.",
        ),
        {
          bottleneck_strength: 44,
          supply_chain_control: 40,
          replaceability: 66,
          industry_dependency: 38,
        },
      ),
      seed(
        "DDOG",
        "Datadog",
        "Data & Security Platforms — observability and telemetry",
        "PERIPHERAL EXPOSURE",
        why(
          "Observability is operational, not a scarce choke resource for AI deployment.",
          "Clusters deploy with alternative telemetry stacks without blocking compute access.",
          "Observability vendors are highly interchangeable within 1–2 years.",
        ),
        {
          bottleneck_strength: 38,
          supply_chain_control: 34,
          replaceability: 78,
          industry_dependency: 32,
        },
      ),
    ],
  },
};

export function resolveIndustryId(input: string): IndustryId {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_INDUSTRY;
  }

  const aliasMatch = INDUSTRY_ALIASES[normalized];
  if (aliasMatch) {
    return aliasMatch;
  }

  const presetMatch = (Object.keys(INDUSTRY_PRESETS) as IndustryId[]).find(
    (id) => id.toLowerCase() === normalized,
  );

  return presetMatch ?? DEFAULT_INDUSTRY;
}

export function getIndustryPreset(input: string): IndustryPreset {
  const id = resolveIndustryId(input);
  return INDUSTRY_PRESETS[id];
}

export function normalizeAnalysisCompanies(companies: Company[]): Company[] {
  return companies.map((company) => normalizeCompany(company));
}
