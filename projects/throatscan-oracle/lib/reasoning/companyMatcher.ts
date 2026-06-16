import { COMPANY_UNIVERSE } from "../companyUniverse";
import { tokenizeIndustry } from "../industryAliases";
import type { CompanySeed } from "../mockData";
import {
  buildWhyIncluded,
  buildWhyNotOthers,
} from "./auditTrail";
import {
  evaluateSelectionConstraints,
  passesSelectionConstraints,
} from "./constraints";
import type {
  BottleneckInsight,
  CompanyMatchReason,
  ConfidenceLevel,
  IndustryIntent,
  SupplyLayerId,
  SupplyRole,
} from "./types";
import {
  SUPPLY_ROLE_LABELS,
  inferCompanyRoles,
  inferDependsOn,
  inferRequiredRoles,
  scoreCompanyForRole,
} from "./supplyRoles";

const ROLE_MATCH_THRESHOLD = 42;
const SECTOR_FLOOR = 20;
const MIN_POOL_SIZE = 3;
const LOW_CONFIDENCE_THRESHOLD = 58;
const GENERIC_QUERY_TOKENS = new Set([
  "ai",
  "and",
  "data",
  "energy",
  "industry",
  "market",
  "stock",
  "stocks",
  "technology",
  "value",
  "chain",
]);

function tokenMatchesField(token: string, field: string): boolean {
  const lowerField = field.toLowerCase();
  const lowerToken = token.toLowerCase();
  if (lowerToken.length <= 3) {
    return new RegExp(`\\b${lowerToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      lowerField,
    );
  }
  return lowerField.includes(lowerToken);
}

function sectorSimilarity(company: CompanySeed, signals: string[]): number {
  let score = 0;
  const tokens = signals.map((signal) => normalizeQueryToken(signal));

  for (const signal of tokens) {
    for (const tag of company.sector_tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower.includes(signal) || signal.includes(tagLower)) score += 18;
    }
  }

  for (const token of tokens.flatMap((signal) => signal.split(/\s+/)).filter((t) => t.length > 2)) {
    if (company.keywords.some((keyword) => tokenMatchesField(token, keyword))) score += 20;
  }

  return Math.min(100, score);
}

function normalizeQueryToken(token: string): string {
  const lower = token.toLowerCase();
  return lower.length > 4 && lower.endsWith("s") ? lower.slice(0, -1) : lower;
}

function directQueryAlignment(company: CompanySeed, rawInput: string): number {
  const queryTokens = tokenizeIndustry(rawInput)
    .map(normalizeQueryToken)
    .filter((token) => token.length > 2 && !GENERIC_QUERY_TOKENS.has(token));

  if (queryTokens.length === 0) {
    return 50;
  }

  const fields = [company.chain_position, ...company.sector_tags, ...company.keywords];
  const matched = queryTokens.filter((token) =>
    fields.some((field) => tokenMatchesField(token, field)),
  ).length;

  return Math.round((matched / queryTokens.length) * 100);
}

function layerForRole(role: SupplyRole): SupplyLayerId {
  const map: Record<SupplyRole, SupplyLayerId> = {
    material_bottleneck: "materials",
    equipment_supplier: "materials",
    compute_provider: "core_technology",
    infrastructure_enabler: "infrastructure",
    platform_controller: "infrastructure",
    downstream_consumer: "demand",
  };
  return map[role];
}

export function matchCompaniesByRole(
  intent: IndustryIntent,
  bottleneck: BottleneckInsight,
): { matches: CompanyMatchReason[]; unfilled_roles: SupplyRole[] } {
  const requirements = inferRequiredRoles(bottleneck);
  const tokens = tokenizeIndustry(intent.raw_input);
  const signals = [...intent.sector_signals, ...tokens.map((token) => token.toLowerCase())];
  const picked = new Set<string>();
  const matches: CompanyMatchReason[] = [];
  const unfilled_roles: SupplyRole[] = [];

  for (const requirement of requirements) {
    const ranked = COMPANY_UNIVERSE.map((company) => {
      const roleScore = scoreCompanyForRole(company, requirement.role);
      const sectorScore = sectorSimilarity(company, signals);
      const queryAlignment = directQueryAlignment(company, intent.raw_input);
      const roles = inferCompanyRoles(company);
      const roleBonus = roles.includes(requirement.role) ? 15 : 0;
      const constraints = evaluateSelectionConstraints(company, bottleneck);
      const composite = Math.round(
        roleScore * 0.4 +
          sectorScore * 0.2 +
          queryAlignment * 0.2 +
          roleBonus +
          requirement.priority * 0.05,
      );

      return { company, roleScore, sectorScore, queryAlignment, composite, constraints };
    })
      .filter((entry) => !picked.has(entry.company.ticker))
      .filter((entry) => passesSelectionConstraints(entry.company, bottleneck))
      .filter(
        (entry) =>
          entry.queryAlignment >= 40 &&
          entry.roleScore >= ROLE_MATCH_THRESHOLD &&
          entry.sectorScore >= SECTOR_FLOOR,
      )
      .sort(
        (a, b) =>
          b.composite - a.composite ||
          b.roleScore - a.roleScore ||
          a.company.ticker.localeCompare(b.company.ticker),
      );

    const best = ranked[0];
    if (!best) {
      unfilled_roles.push(requirement.role);
      continue;
    }

    picked.add(best.company.ticker);
    const role = requirement.role;
    const label = SUPPLY_ROLE_LABELS[role];
    const proxy =
      best.sectorScore < 25
        ? `Uncertain proxy mapping for ${label}.`
        : undefined;

    matches.push({
      ticker: best.company.ticker,
      supply_role: role,
      supply_role_label: label,
      sector_similarity: best.sectorScore,
      role_fit: best.roleScore,
      dependency_exposure: Math.round(best.company.breakdown.industry_dependency ?? 50),
      substitution_difficulty: Math.round(100 - (best.company.breakdown.replaceability ?? 50)),
      composite: best.composite,
      mapped_layer: layerForRole(role),
      why_selected: buildWhyIncluded(
        best.company,
        label,
        best.constraints,
        best.roleScore,
        best.sectorScore,
        intent,
      ),
      why_not_others: buildWhyNotOthers(
        {
          ticker: best.company.ticker,
          supply_role: role,
          supply_role_label: label,
          sector_similarity: best.sectorScore,
          role_fit: best.roleScore,
          dependency_exposure: 0,
          substitution_difficulty: 0,
          composite: best.composite,
          mapped_layer: layerForRole(role),
          why_selected: "",
          why_not_others: "",
          depends_on: "",
          match_confidence: best.composite,
          constraints_met: best.constraints,
        },
        ranked,
        bottleneck,
      ),
      depends_on: inferDependsOn(best.company, role),
      match_confidence: Math.min(100, best.composite),
      constraints_met: best.constraints,
      proxy_note: proxy,
    });

    if (matches.length >= 8) break;
  }

  return { matches, unfilled_roles };
}

export function matchCompanies(
  intent: IndustryIntent,
  bottleneck: BottleneckInsight,
): CompanyMatchReason[] {
  return matchCompaniesByRole(intent, bottleneck).matches.sort(
    (a, b) => b.composite - a.composite || a.ticker.localeCompare(b.ticker),
  );
}

export function selectCompanySeeds(matches: CompanyMatchReason[]): CompanySeed[] {
  return matches
    .map((match) => COMPANY_UNIVERSE.find((company) => company.ticker === match.ticker))
    .filter((company): company is CompanySeed => company !== undefined);
}

export function resolvePrimaryTicker(
  matches: CompanyMatchReason[],
  seeds: CompanySeed[],
): string {
  const bottleneckRoles: SupplyRole[] = ["material_bottleneck", "compute_provider"];
  const roleMatch = matches.find((match) => bottleneckRoles.includes(match.supply_role));
  if (roleMatch) return roleMatch.ticker;

  const core = matches.find((match) => {
    const seed = seeds.find((company) => company.ticker === match.ticker);
    return seed?.throat_role === "CORE BOTTLENECK";
  });
  return core?.ticker ?? matches[0]?.ticker ?? "N/A";
}

export function computeConfidence(
  matches: CompanyMatchReason[],
  unfilledRoles: SupplyRole[],
  intent: IndustryIntent,
): {
  confidence: number;
  confidence_level: ConfidenceLevel;
  uncertain_mapping: boolean;
  uncertainty_message?: string;
} {
  if (matches.length === 0) {
    return {
      confidence: 0,
      confidence_level: "LOW",
      uncertain_mapping: true,
      uncertainty_message:
        "LOW CONFIDENCE — no companies passed hard constraint gate and role thresholds. Top 5 ranking withheld.",
    };
  }

  if (matches.length < MIN_POOL_SIZE) {
    return {
      confidence: Math.round(
        matches.reduce((sum, match) => sum + match.match_confidence, 0) / matches.length,
      ),
      confidence_level: "LOW",
      uncertain_mapping: true,
      uncertainty_message: `LOW CONFIDENCE — only ${matches.length} constrained candidates found (minimum ${MIN_POOL_SIZE}). Partial ranking shown; do not force Top 5.`,
    };
  }

  const avgMatch =
    matches.reduce((sum, match) => sum + match.match_confidence, 0) / matches.length;
  const avgSector =
    matches.reduce((sum, match) => sum + match.sector_similarity, 0) / matches.length;
  const roleFill =
    unfilledRoles.length === 0 ? 1 : Math.max(0, 1 - unfilledRoles.length / 6);
  const intentBoost = (intent.confidence ?? 65) / 100;
  const confidence = Math.round(
    avgMatch * 0.45 + avgSector * 0.25 + roleFill * 100 * 0.2 + intentBoost * 100 * 0.1,
  );
  const uncertain_mapping =
    confidence < LOW_CONFIDENCE_THRESHOLD ||
    unfilledRoles.length > 0 ||
    avgMatch < 45 ||
    avgSector < 25;
  const confidence_level: ConfidenceLevel =
    uncertain_mapping ? "LOW" : "HIGH";

  let uncertainty_message: string | undefined;
  if (uncertain_mapping) {
    uncertainty_message =
      unfilledRoles.length > 0
        ? `LOW CONFIDENCE — unfilled roles: ${unfilledRoles.map((role) => SUPPLY_ROLE_LABELS[role]).join(", ")}. Treat candidates as proxies; Top 5 may be incomplete.`
        : "LOW CONFIDENCE — constrained mapping confidence below threshold. Top 5 may be incomplete.";
  }

  return { confidence, confidence_level, uncertain_mapping, uncertainty_message };
}

export { MIN_POOL_SIZE, LOW_CONFIDENCE_THRESHOLD };
