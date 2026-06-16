import type { CompanyAuditRecord } from "./auditTrail";
import type {
  BottleneckInsight,
  IndustryIntent,
  SupplyChainLayer,
} from "./types";
import { hashInputKey, normalizeInputKey } from "./determinism";

export interface FinalRankingEntry {
  rank: number;
  ticker: string;
  name: string;
  throat_score: number;
  confidence: number;
  supply_role_label: string;
}

export interface StructuredReasoningReport {
  run_id: string;
  section_a_industry_interpretation: {
    user_input: string;
    display_label: string;
    normalized_query: string;
    demand_driver: string;
    end_market: string;
    sector_signals: string[];
    physical_intensity: number;
    regulation_intensity: number;
  };
  section_b_supply_chain_layers: SupplyChainLayer[];
  section_c_bottleneck_identification: BottleneckInsight & {
    layer_ranking: Array<{
      id: SupplyChainLayer["id"];
      name: string;
      composite_pressure: number;
    }>;
  };
  section_d_company_candidates: CompanyAuditRecord[];
  section_e_final_ranking: FinalRankingEntry[];
}

export function buildStructuredReport(
  intent: IndustryIntent,
  layers: SupplyChainLayer[],
  bottleneck: BottleneckInsight,
  auditRecords: CompanyAuditRecord[],
  finalRanking: FinalRankingEntry[],
): StructuredReasoningReport {
  const run_id = hashInputKey(normalizeInputKey(intent.raw_input));

  return {
    run_id,
    section_a_industry_interpretation: {
      user_input: intent.raw_input,
      display_label: intent.display_label,
      normalized_query: intent.normalized_query,
      demand_driver: intent.demand_driver,
      end_market: intent.end_market,
      sector_signals: intent.sector_signals,
      physical_intensity: intent.physical_intensity,
      regulation_intensity: intent.regulation_intensity,
    },
    section_b_supply_chain_layers: layers,
    section_c_bottleneck_identification: {
      ...bottleneck,
      layer_ranking: [...layers]
        .sort(
          (a, b) =>
            b.composite_pressure - a.composite_pressure || a.id.localeCompare(b.id),
        )
        .map((layer) => ({
          id: layer.id,
          name: layer.name,
          composite_pressure: layer.composite_pressure,
        })),
    },
    section_d_company_candidates: auditRecords,
    section_e_final_ranking: finalRanking,
  };
}

export function attachStructuredReport(
  intent: IndustryIntent,
  layers: SupplyChainLayer[],
  bottleneck: BottleneckInsight,
  auditRecords: CompanyAuditRecord[],
  finalRanking: FinalRankingEntry[],
): StructuredReasoningReport {
  return buildStructuredReport(intent, layers, bottleneck, auditRecords, finalRanking);
}
