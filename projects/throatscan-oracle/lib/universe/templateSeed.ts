import type { CompanySeed } from "../mockData";
import type { ThroatRole } from "../types";
import { company, why } from "../companyUniverseHelpers";

const ROLE_BREAKDOWN: Record<
  ThroatRole,
  { bottleneck_strength: number; supply_chain_control: number; replaceability: number; industry_dependency: number }
> = {
  "CORE BOTTLENECK": {
    bottleneck_strength: 84,
    supply_chain_control: 80,
    replaceability: 28,
    industry_dependency: 82,
  },
  "STRATEGIC ENABLER": {
    bottleneck_strength: 72,
    supply_chain_control: 70,
    replaceability: 42,
    industry_dependency: 70,
  },
  "DOWNSTREAM USER": {
    bottleneck_strength: 58,
    supply_chain_control: 54,
    replaceability: 52,
    industry_dependency: 55,
  },
  "PERIPHERAL EXPOSURE": {
    bottleneck_strength: 50,
    supply_chain_control: 48,
    replaceability: 58,
    industry_dependency: 48,
  },
};

export interface WaveSeedInput {
  ticker: string;
  name: string;
  chain_position: string;
  throat_role: ThroatRole;
  sector_tags: string[];
  keywords: string[];
  scarce_resource?: string;
  can_function_without?: string;
  replaceability_note?: string;
  breakdown?: {
    bottleneck_strength: number;
    supply_chain_control: number;
    replaceability: number;
    industry_dependency: number;
  };
}

export function companyFromWaveSeed(input: WaveSeedInput): CompanySeed {
  const breakdown = input.breakdown ?? ROLE_BREAKDOWN[input.throat_role];
  return company(
    input.ticker,
    input.name,
    input.chain_position,
    input.throat_role,
    input.sector_tags,
    input.keywords,
    why(
      input.scarce_resource ??
        `Qualified ${input.sector_tags[0] ?? "sector"} capacity and design-in position for ${input.name}.`,
      input.can_function_without ??
        `The broader ${input.sector_tags[0] ?? "industry"} chain can reroute around a single vendor over time.`,
      input.replaceability_note ??
        "Share shifts among qualified vendors over a 1–3 year cycle depending on capacity and pricing.",
    ),
    breakdown,
  );
}
