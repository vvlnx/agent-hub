import type { CompanySeed } from "./mockData";
import { company, why } from "./companyUniverseHelpers";

/** Hand-curated service-sector deep entries (thesis-grade, not template pack). */
export const COMPANY_UNIVERSE_SERVICE_DEEP: CompanySeed[] = [
  company(
    "COST",
    "Costco Wholesale",
    "Warehouse club retail — membership-driven consumer staples distribution",
    "STRATEGIC ENABLER",
    ["Consumer"],
    ["retail", "warehouse club", "consumer", "staples", "membership", "grocery"],
    why(
      "Membership renewal rates and limited-SKU buying power create recurring traffic and pricing leverage with suppliers.",
      "Consumers can shift to other grocers and clubs, but switching membership ecosystems has moderate friction.",
      "Sam's Club and BJ's compete on renewal promotions over 1–3 year cycles.",
    ),
    { bottleneck_strength: 76, supply_chain_control: 74, replaceability: 38, industry_dependency: 72 },
  ),
  company(
    "WMT",
    "Walmart",
    "Mass retail — grocery and big-box consumer distribution",
    "STRATEGIC ENABLER",
    ["Consumer"],
    ["retail", "grocery", "consumer", "staples", "big box", "omnichannel"],
    why(
      "National store footprint and grocery mix anchor everyday consumer spend and supplier shelf leverage.",
      "Retail demand continues through alternate chains, but Walmart scale influences CPG allocation decisions.",
      "Target, Amazon, and regional grocers compete for share in overlapping categories.",
    ),
    { bottleneck_strength: 78, supply_chain_control: 76, replaceability: 36, industry_dependency: 74 },
  ),
];
