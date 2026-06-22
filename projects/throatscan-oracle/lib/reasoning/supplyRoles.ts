import type { CompanySeed } from "../mockData";
import type { BottleneckInsight, SupplyLayerId } from "./types";

export type SupplyRole =
  | "compute_provider"
  | "equipment_supplier"
  | "material_bottleneck"
  | "downstream_consumer"
  | "infrastructure_enabler"
  | "platform_controller";

export const SUPPLY_ROLE_LABELS: Record<SupplyRole, string> = {
  compute_provider: "Compute provider",
  equipment_supplier: "Equipment supplier",
  material_bottleneck: "Material bottleneck",
  downstream_consumer: "Downstream consumer",
  infrastructure_enabler: "Infrastructure enabler",
  platform_controller: "Platform controller",
};

const ROLE_PATTERNS: Record<SupplyRole, RegExp[]> = {
  compute_provider: [
    /\bgpu\b|accelerator|cuda|compute|chip design|foundry|asic|semiconductor design|tpu|ai compute|qpu|quantum|eda|sequencing/i,
  ],
  equipment_supplier: [
    /equipment|fab|deposition|etch|lithography|wfe|oilfield|tooling|packaging|test equipment|cobot hardware|inspection|metrology|turbine|inverter|laser|photonics/i,
  ],
  material_bottleneck: [
    /lithium|uranium|material|chemical|fuel|cathode|anode|refining|battery input|specialty chemical|hydrocarbon|copper|rare earth|fertilizer|potash|phosphate|magnet|ammonia/i,
  ],
  downstream_consumer: [
    /oem|vehicle|automotive|integrator|prime|pharma|payer|robotics|surgical|exchange|crm|workflow app|utility deployment|retail|brokerage|bnpl|consumer|bank|insurance|managed care|health insurance|hospital|carrier|wireless|broadband|apparel|restaurant|footwear|grocery|staples|logistics|parcel|shipping|freight/i,
  ],
  infrastructure_enabler: [
    /cloud|network|switch|fabric|data center|power|cooling|colocation|hyperscale|rack|thermal|payment rail|optical|fiber|grid|electrical|solar|telecom|tower|wireless|broadband|carrier|pipeline|midstream|utility|electric|transmission|logistics|express|parcel|shipping|freight|warehouse/i,
  ],
  platform_controller: [
    /platform|saas|identity|control plane|database|security platform|workflow|copilot|azure|aws|gcp|observability|zero trust|edge cloud|fintech|streaming|ott|video|marketplace|payments|ratings|exchange|indices|wealth|asset management|ecommerce|content/i,
  ],
};

const LAYER_TO_ROLES: Record<SupplyLayerId, SupplyRole[]> = {
  materials: ["material_bottleneck", "equipment_supplier"],
  core_technology: ["compute_provider", "equipment_supplier"],
  infrastructure: ["infrastructure_enabler", "platform_controller"],
  demand: ["downstream_consumer", "platform_controller"],
};

export interface RoleRequirement {
  role: SupplyRole;
  priority: number;
  layer: SupplyLayerId;
}

export function inferCompanyRoles(company: CompanySeed): SupplyRole[] {
  const haystack = [company.chain_position, ...company.keywords, ...company.sector_tags].join(" ");
  const roles: SupplyRole[] = [];

  for (const [role, patterns] of Object.entries(ROLE_PATTERNS) as Array<[SupplyRole, RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(haystack))) {
      roles.push(role);
    }
  }

  if (roles.length === 0) {
    if (company.throat_role === "CORE BOTTLENECK") roles.push("material_bottleneck");
    else if (company.throat_role === "STRATEGIC ENABLER") roles.push("infrastructure_enabler");
    else roles.push("downstream_consumer");
  }

  return roles;
}

export function scoreCompanyForRole(company: CompanySeed, role: SupplyRole): number {
  const haystack = [company.chain_position, ...company.keywords, ...company.sector_tags]
    .join(" ")
    .toLowerCase();
  const patterns = ROLE_PATTERNS[role];
  let score = inferCompanyRoles(company).includes(role) ? 40 : 0;

  for (const pattern of patterns) {
    if (pattern.test(haystack)) score += 18;
  }

  score += (company.breakdown.industry_dependency ?? 50) * 0.15;
  score += (100 - (company.breakdown.replaceability ?? 50)) * 0.1;

  return Math.min(100, Math.round(score));
}

export function inferRequiredRoles(bottleneck: BottleneckInsight): RoleRequirement[] {
  const primary = bottleneck.primary_layer;
  const rankedLayers = (
    ["materials", "core_technology", "infrastructure", "demand"] as SupplyLayerId[]
  ).sort((a, b) => {
    if (a === primary) return -1;
    if (b === primary) return 1;
    return 0;
  });

  const requirements: RoleRequirement[] = [];
  let priority = 100;

  for (const layer of rankedLayers) {
    for (const role of LAYER_TO_ROLES[layer]) {
      requirements.push({ role, priority, layer });
      priority -= 12;
    }
  }

  const seen = new Set<SupplyRole>();
  return requirements.filter((req) => {
    if (seen.has(req.role)) return false;
    seen.add(req.role);
    return true;
  });
}

export function inferDependsOn(company: CompanySeed, role: SupplyRole): string {
  const scarce = company.why_bottleneck_or_not.scarce_resource;
  if (scarce) return scarce;

  const defaults: Record<SupplyRole, string> = {
    compute_provider: "Upstream wafer, equipment, and packaging capacity",
    equipment_supplier: "Specialty components and process qualification cycles",
    material_bottleneck: "Refined inputs and qualified supplier base",
    downstream_consumer: "Upstream components, platforms, and deployment capacity",
    infrastructure_enabler: "Compute allocation, power, and site availability",
    platform_controller: "Cloud infrastructure, identity, and data gravity",
  };

  return defaults[role];
}
