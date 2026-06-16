import { normalizeBreakdown } from "../types";
import type { CompanySeed } from "../mockData";
import type { BottleneckInsight } from "./types";

export type SelectionConstraint =
  | "bottleneck_resource_control"
  | "irreplaceable_1_3_years"
  | "high_switching_cost"
  | "structural_position";

export const SELECTION_CONSTRAINT_LABELS: Record<SelectionConstraint, string> = {
  bottleneck_resource_control: "Direct control over bottleneck resource",
  irreplaceable_1_3_years: "Irreplaceable in 1–3 years",
  high_switching_cost: "High switching-cost dependency",
  structural_position: "Structural supply chain position",
};

const CONTROL_THRESHOLD = 70;
const BOTTLENECK_STRENGTH_THRESHOLD = 75;
const IRREPLACEABLE_THRESHOLD = 35;
const SWITCHING_DEPENDENCY_THRESHOLD = 65;
const SWITCHING_REPLACEABILITY_CEILING = 50;
const STRUCTURAL_ENABLER_THRESHOLD = 70;

export function evaluateSelectionConstraints(
  company: CompanySeed,
  bottleneck: BottleneckInsight,
): SelectionConstraint[] {
  void bottleneck;
  const breakdown = normalizeBreakdown(company.breakdown);
  const met: SelectionConstraint[] = [];

  if (
    breakdown.supply_chain_control >= CONTROL_THRESHOLD ||
    breakdown.bottleneck_strength >= BOTTLENECK_STRENGTH_THRESHOLD
  ) {
    met.push("bottleneck_resource_control");
  }

  if (breakdown.replaceability <= IRREPLACEABLE_THRESHOLD) {
    met.push("irreplaceable_1_3_years");
  }

  if (
    breakdown.industry_dependency >= SWITCHING_DEPENDENCY_THRESHOLD &&
    breakdown.replaceability <= SWITCHING_REPLACEABILITY_CEILING
  ) {
    met.push("high_switching_cost");
  }

  if (
    company.throat_role === "CORE BOTTLENECK" ||
    (company.throat_role === "STRATEGIC ENABLER" &&
      breakdown.bottleneck_strength >= STRUCTURAL_ENABLER_THRESHOLD)
  ) {
    met.push("structural_position");
  }

  return met;
}

export function passesSelectionConstraints(
  company: CompanySeed,
  bottleneck: BottleneckInsight,
): boolean {
  return evaluateSelectionConstraints(company, bottleneck).length > 0;
}

export function formatConstraintsMet(constraints: SelectionConstraint[]): string {
  return constraints.map((constraint) => SELECTION_CONSTRAINT_LABELS[constraint]).join("; ");
}
