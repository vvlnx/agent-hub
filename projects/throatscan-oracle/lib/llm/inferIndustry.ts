import { COMPANY_UNIVERSE } from "../companyUniverse";
import type { IndustryInterpretation, SupplyChainArchetype } from "../mockData";
import { getLLMConfig } from "./config";
import { buildWebSearchTool, callResponsesAPI } from "./responses";
import type { LLMIndustryPayload } from "./types";

const VALID_ARCHETYPES: SupplyChainArchetype[] = [
  "compute_hardware",
  "ai_infrastructure",
  "platform_software",
  "energy_materials",
  "healthcare",
  "defense",
  "robotics",
  "general",
];

const ALLOWED_TICKERS = COMPANY_UNIVERSE.map((company) => company.ticker);

const SYSTEM_PROMPT = `You are ThroatScan Oracle — a supply-chain bottleneck intelligence engine for US equities.

Given a free-text industry query, return ONLY valid JSON (no markdown) with:
- display_label: concise industry label
- sector_tags: 2-4 sector classifications (e.g. "Semiconductors", "AI Infrastructure")
- archetype: one of ${VALID_ARCHETYPES.join(", ")}
- bottleneck_hint: one sentence on where the choke point sits
- chain: 3-6 supply chain nodes, each with name, description, stage (upstream|midstream|downstream)
- preferred_tickers: 5-8 US tickers chosen ONLY from this allowlist: ${ALLOWED_TICKERS.join(", ")}
- summary_en: one sentence explaining the mapping

Focus on physical supply-chain choke points, not financial ratings.`;

const INDUSTRY_PROFILE_SCHEMA = {
  type: "object",
  properties: {
    display_label: { type: "string" },
    sector_tags: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    archetype: { type: "string", enum: VALID_ARCHETYPES },
    bottleneck_hint: { type: "string" },
    chain: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          stage: { type: "string", enum: ["upstream", "midstream", "downstream"] },
        },
        required: ["name", "description", "stage"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 6,
    },
    preferred_tickers: {
      type: "array",
      items: { type: "string", enum: ALLOWED_TICKERS },
      minItems: 5,
      maxItems: 8,
    },
    summary_en: { type: "string" },
  },
  required: [
    "display_label",
    "sector_tags",
    "archetype",
    "bottleneck_hint",
    "chain",
    "preferred_tickers",
    "summary_en",
  ],
  additionalProperties: false,
} as const;

function normalizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseArchetype(value: unknown): SupplyChainArchetype {
  if (typeof value === "string" && VALID_ARCHETYPES.includes(value as SupplyChainArchetype)) {
    return value as SupplyChainArchetype;
  }
  return "general";
}

function parseChain(value: unknown): LLMIndustryPayload["chain"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((node) => {
      if (!node || typeof node !== "object") {
        return null;
      }
      const record = node as Record<string, unknown>;
      const stage = record.stage;
      if (stage !== "upstream" && stage !== "midstream" && stage !== "downstream") {
        return null;
      }
      if (typeof record.name !== "string" || typeof record.description !== "string") {
        return null;
      }
      return {
        name: record.name.trim(),
        description: record.description.trim(),
        stage,
      };
    })
    .filter((node): node is LLMIndustryPayload["chain"][number] => node !== null);
}

function parseTickers(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set(ALLOWED_TICKERS);
  return value
    .filter((ticker): ticker is string => typeof ticker === "string")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => allowed.has(ticker))
    .slice(0, 8);
}

function parsePayload(raw: unknown, userInput: string): LLMIndustryPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const sector_tags = Array.isArray(record.sector_tags)
    ? record.sector_tags
        .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
        .map((tag) => tag.trim())
        .slice(0, 4)
    : [];

  const chain = parseChain(record.chain);
  const preferred_tickers = parseTickers(record.preferred_tickers);

  if (sector_tags.length === 0 || chain.length < 3 || preferred_tickers.length < 5) {
    return null;
  }

  return {
    display_label:
      typeof record.display_label === "string" && record.display_label.trim()
        ? record.display_label.trim()
        : titleCase(userInput),
    sector_tags,
    archetype: parseArchetype(record.archetype),
    bottleneck_hint:
      typeof record.bottleneck_hint === "string" && record.bottleneck_hint.trim()
        ? record.bottleneck_hint.trim()
        : "Midstream production and qualified supply",
    chain,
    preferred_tickers,
    summary_en:
      typeof record.summary_en === "string" && record.summary_en.trim()
        ? record.summary_en.trim()
        : undefined,
  };
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error("LLM response did not contain JSON");
}

export async function fetchIndustryFromLLM(
  userInput: string,
  fallback: IndustryInterpretation,
): Promise<IndustryInterpretation> {
  const config = getLLMConfig();
  if (!config) {
    return fallback;
  }

  const normalized = normalizeInput(userInput) || "General Industry";
  const webSearchTool = buildWebSearchTool(config);

  try {
    const response = await callResponsesAPI(config, {
      model: config.model,
      store: false,
      instructions: `${SYSTEM_PROMPT}\nUse web search to ground current industry claims. Prioritize primary sources, regulators, company filings, and established reporting.`,
      input: `Research industry query: "${normalized}" and return the requested structured profile.`,
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
          name: "throatscan_industry_profile",
          strict: true,
          schema: INDUSTRY_PROFILE_SCHEMA,
        },
      },
    });

    if (!response.outputText) {
      throw new Error("LLM returned empty content");
    }

    const payload = parsePayload(extractJson(response.outputText), normalized);
    if (!payload) {
      throw new Error("LLM JSON failed validation");
    }

    return {
      user_input: normalized,
      display_label: payload.display_label,
      sector_tags: payload.sector_tags,
      archetype: payload.archetype,
      inference_mode: "llm_remote",
      bottleneck_hint: payload.bottleneck_hint,
      summary_en: payload.summary_en,
      end_market: payload.sector_tags.join(" / "),
      demand_driver: payload.summary_en ?? `Demand in ${payload.display_label}`,
      selection_rationale: `LLM-augmented reasoning for ${payload.display_label}.`,
      research_sources: response.sources,
      research_queries: response.searchQueries,
      web_search_used: response.webSearchUsed,
    };
  } catch {
    return fallback;
  }
}
