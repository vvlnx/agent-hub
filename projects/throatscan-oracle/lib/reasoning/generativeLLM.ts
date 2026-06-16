import { isLLMConfigured } from "../llm/config";
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
  const config = process.env.OPENAI_API_KEY?.trim();
  if (!config || !isLLMConfigured()) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an open-world supply chain analyst. Return JSON only with demand_driver, end_market, sector_signals (array), layers (array of {id: demand|infrastructure|core_technology|materials, name, description}), confidence (0-1). Do NOT return ticker symbols.",
        },
        {
          role: "user",
          content: `Analyze industry query: "${intent.raw_input}". Infer supply chain structure generatively.`,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) return null;

  const payload = extractJson(content) as GenerativeLLMPayload;
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
  };
}
