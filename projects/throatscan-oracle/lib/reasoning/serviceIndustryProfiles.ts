import { normalizeIndustryQuery } from "../industryAliases";
import type { IndustryIntent, SupplyLayerId } from "./types";
import type { SupplyRole } from "./supplyRoles";

export type ServiceIndustryId =
  | "financials_banking"
  | "healthcare_services"
  | "telecom_broadband"
  | "media_streaming"
  | "consumer_retail"
  | "logistics_shipping"
  | "utilities_power";

export interface ServiceIndustryProfile {
  id: ServiceIndustryId;
  /** Normalized query string from industryAliases. */
  canonical: string;
  primary_layer: SupplyLayerId;
  role_priority: SupplyRole[];
  sector_tags: string[];
  query_pattern: RegExp;
  preferred_keywords: RegExp[];
  deprioritize_keywords?: RegExp[];
  /** Penalize companies matching this unless the user query also matches. */
  cross_sector_guard?: RegExp;
  relax_constraints: boolean;
  /** After role pass, fill additional slots from the primary service role. */
  fill_same_role_slots?: number;
}

const SERVICE_PROFILES: ServiceIndustryProfile[] = [
  {
    id: "financials_banking",
    canonical: "financials banking",
    primary_layer: "infrastructure",
    role_priority: ["downstream_consumer"],
    fill_same_role_slots: 3,
    sector_tags: ["Financials", "Fintech"],
    query_pattern: /financials?\s*banking|banking|bank|insurance|brokerage|asset management|券商|银行|金融|保险/i,
    preferred_keywords: [
      /\bbank\b/i,
      /investment bank/i,
      /diversified bank/i,
      /brokerage/i,
      /asset management/i,
      /wealth management/i,
    ],
    deprioritize_keywords: [
      /credit card/i,
      /payments network/i,
      /card network/i,
      /global payments network/i,
      /retail brokerage/i,
      /trading app/i,
    ],
    relax_constraints: true,
  },
  {
    id: "healthcare_services",
    canonical: "healthcare services",
    primary_layer: "demand",
    role_priority: ["downstream_consumer", "platform_controller", "infrastructure_enabler"],
    sector_tags: ["Healthcare", "Biotech"],
    query_pattern: /healthcare\s*services?|health\s*insurance|managed care|payer|医疗服务|医保|医疗|医院/i,
    preferred_keywords: [/payer/i, /health insurance/i, /managed care/i, /medicare/i, /pharmacy benefit/i],
    deprioritize_keywords: [/biologics/i, /oncology/i, /sequencing/i, /diagnostics tools/i, /reagents/i],
    relax_constraints: true,
  },
  {
    id: "telecom_broadband",
    canonical: "telecom broadband",
    primary_layer: "infrastructure",
    role_priority: ["infrastructure_enabler"],
    fill_same_role_slots: 3,
    sector_tags: ["Telecom"],
    query_pattern: /telecom|broadband|wireless|carrier|5g|operator|通信|电信|宽带|运营商/i,
    preferred_keywords: [/wireless carrier/i, /telecom carrier/i, /\bcarrier\b/i, /\bwireless\b/i, /\b5g\b/i, /integrated telecom/i, /mobile broadband/i],
    deprioritize_keywords: [
      /cable communications/i,
      /broadcast/i,
      /media conglomerate/i,
      /tower reit/i,
      /cell tower/i,
      /tower landlord/i,
      /\btower\b.*\breit\b/i,
      /small cell landlord/i,
    ],
    cross_sector_guard: /\bsatellite\b|\bspace\b|\blaunch\b|\borbital\b/i,
    relax_constraints: true,
  },
  {
    id: "media_streaming",
    canonical: "media streaming",
    primary_layer: "demand",
    role_priority: ["platform_controller"],
    fill_same_role_slots: 3,
    sector_tags: ["Platform Software", "Media"],
    query_pattern: /media\s*streaming|streaming|ott|video platform|entertainment|流媒体|传媒|视频/i,
    preferred_keywords: [/streaming/i, /\bott\b/i, /video platform/i, /audio platform/i, /ctv/i],
    deprioritize_keywords: [/cable communications/i, /broadcast network/i],
    relax_constraints: true,
  },
  {
    id: "consumer_retail",
    canonical: "consumer retail",
    primary_layer: "demand",
    role_priority: ["downstream_consumer"],
    fill_same_role_slots: 3,
    sector_tags: ["Consumer"],
    query_pattern: /consumer\s*retail|retail|apparel|restaurant|brand|消费|零售|餐饮|服装/i,
    preferred_keywords: [
      /mass retail/i,
      /warehouse club/i,
      /apparel retail/i,
      /footwear/i,
      /grocery/i,
      /restaurant/i,
      /off-price retail/i,
    ],
    deprioritize_keywords: [
      /fintech/i,
      /bnpl/i,
      /digital wallet/i,
      /pharmacy/i,
      /dating/i,
      /health insurance/i,
      /brokerage/i,
      /trading app/i,
      /digital bank/i,
      /digital lending/i,
      /neobank/i,
      /consumer finance/i,
    ],
    relax_constraints: true,
  },
  {
    id: "logistics_shipping",
    canonical: "logistics shipping",
    primary_layer: "infrastructure",
    role_priority: ["infrastructure_enabler"],
    fill_same_role_slots: 2,
    sector_tags: ["Robotics", "Logistics"],
    query_pattern: /logistics|shipping|parcel|freight|express|delivery|物流|快递|航运/i,
    preferred_keywords: [/logistics/i, /parcel/i, /express/i, /freight/i, /shipping/i, /delivery/i],
    cross_sector_guard: /\bquantum\b|\bqpu\b|\bqubit\b/i,
    relax_constraints: true,
  },
  {
    id: "utilities_power",
    canonical: "utilities power grid",
    primary_layer: "infrastructure",
    role_priority: ["infrastructure_enabler", "material_bottleneck", "downstream_consumer"],
    sector_tags: ["Energy Materials", "Utilities"],
    query_pattern: /utilities?\s*power|power\s*grid|electric\s*utility|grid|公用事业|电力|电网/i,
    preferred_keywords: [/electric utility/i, /regulated utility/i, /power grid/i, /transmission/i, /nuclear utility/i],
    deprioritize_keywords: [/nuclear developer/i, /small modular reactor/i],
    relax_constraints: true,
  },
];

export function resolveServiceIndustryProfile(
  intent: Pick<IndustryIntent, "raw_input" | "normalized_query">,
): ServiceIndustryProfile | null {
  const normalized = intent.normalized_query.toLowerCase();
  const raw = intent.raw_input;

  for (const profile of SERVICE_PROFILES) {
    if (normalized === profile.canonical || profile.query_pattern.test(raw)) {
      return profile;
    }
  }

  const aliased = normalizeIndustryQuery(raw).toLowerCase();
  return SERVICE_PROFILES.find((profile) => profile.canonical === aliased) ?? null;
}

export function serviceIndustryLayerBias(
  profile: ServiceIndustryProfile,
): Partial<Record<SupplyLayerId, number>> {
  const bias: Partial<Record<SupplyLayerId, number>> = {
    demand: 0.4,
    infrastructure: 0.4,
    core_technology: 0.35,
    materials: 0.35,
  };
  bias[profile.primary_layer] = 1;
  if (profile.primary_layer === "demand") {
    bias.infrastructure = 0.85;
  }
  if (profile.primary_layer === "infrastructure") {
    bias.demand = 0.75;
  }
  return bias;
}

export function serviceIndustryRoleRequirements(profile: ServiceIndustryProfile): Array<{
  role: SupplyRole;
  priority: number;
  layer: SupplyLayerId;
}> {
  const layerForRole: Record<SupplyRole, SupplyLayerId> = {
    material_bottleneck: "materials",
    equipment_supplier: "materials",
    compute_provider: "core_technology",
    infrastructure_enabler: "infrastructure",
    platform_controller: "infrastructure",
    downstream_consumer: "demand",
  };

  return profile.role_priority.map((role, index) => ({
    role,
    priority: 100 - index * 14,
    layer: layerForRole[role],
  }));
}

export function companyHaystack(company: {
  chain_position: string;
  keywords: string[];
  sector_tags: string[];
}): string {
  return [company.chain_position, ...company.keywords, ...company.sector_tags].join(" ").toLowerCase();
}

export function violatesServiceCrossSectorGuard(
  profile: ServiceIndustryProfile,
  companyHaystackValue: string,
  queryText: string,
): boolean {
  if (!profile.cross_sector_guard) return false;
  if (!profile.cross_sector_guard.test(companyHaystackValue)) return false;
  return !profile.cross_sector_guard.test(queryText.toLowerCase());
}

export function serviceKeywordAdjustment(
  profile: ServiceIndustryProfile,
  companyHaystackValue: string,
): number {
  let adjustment = 0;
  for (const pattern of profile.preferred_keywords) {
    if (pattern.test(companyHaystackValue)) adjustment += 14;
  }
  for (const pattern of profile.deprioritize_keywords ?? []) {
    if (pattern.test(companyHaystackValue)) adjustment -= 18;
  }
  if (profile.id === "consumer_retail" && /dating|match group|social network/i.test(companyHaystackValue)) {
    adjustment -= 40;
  }
  if (profile.id === "consumer_retail" && /pharmacy|drugstore|health insurance/i.test(companyHaystackValue)) {
    adjustment -= 35;
  }
  if (profile.id === "financials_banking" && /payments network|card network|global payments/i.test(companyHaystackValue)) {
    adjustment -= 30;
  }
  if (profile.id === "telecom_broadband" && /tower|reit|landlord|small cell/i.test(companyHaystackValue)) {
    adjustment -= 35;
  }
  if (profile.id === "telecom_broadband" && /wireless carrier|telecom carrier|integrated telecom/i.test(companyHaystackValue)) {
    adjustment += 22;
  }
  return adjustment;
}
