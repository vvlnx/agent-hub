import type { CompanySeed } from "../mockData";
import type { BottleneckInsight, CompanyMatchReason, IndustryIntent, SupplyRole } from "./types";
import {
  SELECTION_CONSTRAINT_LABELS,
  evaluateSelectionConstraints,
  formatConstraintsMet,
  type SelectionConstraint,
} from "./constraints";

export interface RejectedCandidate {
  ticker: string;
  name: string;
  reason: string;
}

export interface CompanyAuditRecord {
  ticker: string;
  name: string;
  supply_role: SupplyRole;
  supply_role_label: string;
  why_included: string;
  why_not_others: string;
  depends_on: string;
  confidence: number;
  constraints_met: SelectionConstraint[];
  constraint_labels: string[];
  throat_score?: number;
  rank?: number;
}

interface RankedEntry {
  company: CompanySeed;
  roleScore: number;
  sectorScore: number;
  composite: number;
}

function buildRejectionReason(
  entry: RankedEntry,
  selectedTicker: string,
  constraints: SelectionConstraint[],
): string {
  if (entry.company.ticker === selectedTicker) {
    return "Selected for this role slot.";
  }

  const entryConstraints = evaluateSelectionConstraints(entry.company, {
    primary_layer: "materials",
    constraint_type: "supply",
    location_description: "",
    rationale: "",
  });

  if (entryConstraints.length === 0) {
    return `Excluded — fails hard constraint gate (needs ≥1 of: ${Object.values(SELECTION_CONSTRAINT_LABELS).join(", ")}).`;
  }

  if (entry.sectorScore < 20) {
    return `Excluded — weak sector overlap (${entry.sectorScore}/100) vs selected ${selectedTicker}.`;
  }

  if (entry.roleScore < entry.composite * 0.5) {
    return `Excluded — lower role fit (${entry.roleScore}/100) than ${selectedTicker}.`;
  }

  return `Excluded — lower composite score (${entry.composite}) vs ${selectedTicker}; met: ${formatConstraintsMet(constraints)}.`;
}

export function buildWhyNotOthers(
  selected: CompanyMatchReason,
  alternatives: RankedEntry[],
  bottleneck: BottleneckInsight,
): string {
  const rejected = alternatives
    .filter((entry) => entry.company.ticker !== selected.ticker)
    .slice(0, 3)
    .map((entry) => {
      const constraints = evaluateSelectionConstraints(entry.company, bottleneck);
      return `${entry.company.ticker}: ${buildRejectionReason(entry, selected.ticker, constraints)}`;
    });

  if (rejected.length === 0) {
    return "No alternative candidates passed constraint and role thresholds for this slot.";
  }

  return rejected.join(" ");
}

export function buildCompanyAuditRecords(
  matches: CompanyMatchReason[],
  seeds: CompanySeed[],
  rankedScores: Array<{ ticker: string; score: number }>,
): CompanyAuditRecord[] {
  const seedByTicker = new Map(seeds.map((seed) => [seed.ticker, seed]));
  const rankByTicker = new Map(rankedScores.map((row, index) => [row.ticker, index + 1]));

  return matches.map((match) => {
    const seed = seedByTicker.get(match.ticker);
    const constraints = match.constraints_met ?? [];

    return {
      ticker: match.ticker,
      name: seed?.name ?? match.ticker,
      supply_role: match.supply_role,
      supply_role_label: match.supply_role_label,
      why_included: match.why_selected,
      why_not_others: match.why_not_others ?? "",
      depends_on: match.depends_on,
      confidence: stableConfidence(match.match_confidence),
      constraints_met: constraints,
      constraint_labels: constraints.map((c) => SELECTION_CONSTRAINT_LABELS[c]),
      throat_score: rankedScores.find((row) => row.ticker === match.ticker)?.score,
      rank: rankByTicker.get(match.ticker),
    };
  });
}

export function stableConfidence(matchConfidence100: number): number {
  return Math.round((matchConfidence100 / 100) * 1000) / 1000;
}

export function buildWhyIncluded(
  company: CompanySeed,
  roleLabel: string,
  constraints: SelectionConstraint[],
  roleScore: number,
  sectorScore: number,
  intent: IndustryIntent,
): string {
  const constraintText = formatConstraintsMet(constraints);
  return `Included as ${roleLabel} (${roleScore}/100 role fit, ${sectorScore}/100 sector fit) for ${intent.end_market}. Hard constraints satisfied: ${constraintText}.`;
}
