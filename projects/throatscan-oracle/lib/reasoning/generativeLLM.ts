import { getLLMConfig } from "../llm/config";
import { buildWebSearchTool, callResponsesAPI } from "../llm/responses";
import type { IndustryIntent, SupplyLayerId } from "./types";

interface GenerativeLLMPayload {
  demand_driver: string;
  end_market: string;
  sector_signals: string[];
  layers: Array<{
    id: SupplyLayerId;
    name: string;
    description: string;
  }>;
  confidence: number;
}

const INDUSTRY_INTENT_SCHEMA = {
  type: "object",
  properties: {
    demand_driver: { type: "string" },
    end_market: { type: "string" },
    sector_signals: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
    layers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            enum: ["demand", "infrastructure", "core_technology", "materials"],
          },
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["id", "name", "description"],
        additionalProperties: false,
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["demand_driver", "end_market", "sector_signals", "layers", "confidence"],
  additionalProperties: false,
} as const;

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return JSON.parse(fenced[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error("LLM response did not contain JSON");
}

export async function augmentIntentWithLLM(
  intent: IndustryIntent,
): Promise<(IndustryIntent & { layer_bias: Partial<Record<SupplyLayerId, number>> }) | null> {
  const config = getLLMConfig();
  if (!config) return null;

  const webSearchTool = buildWebSearchTool(config);

  try {
    const response = await callResponsesAPI(config, {
      model: config.model,
      store: false,
      instructions:
        "You are an open-world supply-chain analyst. Ground current claims with web search and prioritize primary sources, regulators, company filings, and established reporting. Infer the industry structure only; never select or return ticker symbols.",
      input: `Research and analyze industry query: "${intent.raw_input}". Identify the current demand driver, end market, sector signals, and relevant supply-chain layers.`,
      ...(webSearchTool
        ? {
            tools: [webSearchTool],
            tool_choice: "required",
            include: ["web_search_call.action.sources"],
          }
        : {}),
      text: {
        format: {
          type: "json_schema",
          name: "throatscan_industry_intent",
          strict: true,
          schema: INDUSTRY_INTENT_SCHEMA,
        },
      },
    });

    if (!response.outputText) return null;
    const payload = extractJson(response.outputText) as GenerativeLLMPayload;
    if (!payload.demand_driver || !payload.end_market) return null;

    const layer_bias: Partial<Record<SupplyLayerId, number>> = {
      demand: 0.5,
      infrastructure: 0.5,
      core_technology: 0.5,
      materials: 0.5,
    };

    for (const layer of payload.layers ?? []) {
      if (layer.id in layer_bias) layer_bias[layer.id] = 0.85;
    }

    return {
      ...intent,
      demand_driver: payload.demand_driver,
      end_market: payload.end_market,
      sector_signals: payload.sector_signals?.slice(0, 5) ?? intent.sector_signals,
      layer_bias,
      confidence: Math.round((payload.confidence ?? 0.7) * 100),
      research_sources: response.sources,
      research_queries: response.searchQueries,
      web_search_used: response.webSearchUsed,
    };
  } catch {
    return null;
  }
}
