import type { ChainNode, SupplyChainArchetype } from "../mockData";

export interface LLMIndustryPayload {
  display_label: string;
  sector_tags: string[];
  archetype: SupplyChainArchetype;
  bottleneck_hint: string;
  chain: ChainNode[];
  preferred_tickers: string[];
  summary_en?: string;
}

export interface LLMResearchSource {
  url: string;
  title?: string;
  cited: boolean;
}
