import type { LLMConfig } from "./config";
import type { LLMResearchSource } from "./types";

interface ResponseAnnotation {
  type?: string;
  url?: string;
  title?: string;
}

interface ResponseContent {
  type?: string;
  text?: string;
  annotations?: ResponseAnnotation[];
}

interface ResponseSource {
  url?: string;
  title?: string;
}

interface ResponseAction {
  query?: string;
  queries?: string[];
  sources?: ResponseSource[];
}

interface ResponseOutputItem {
  type?: string;
  content?: ResponseContent[];
  action?: ResponseAction;
}

interface ResponsesEnvelope {
  output?: ResponseOutputItem[];
}

export interface ParsedOpenAIResponse {
  outputText: string;
  sources: LLMResearchSource[];
  searchQueries: string[];
  webSearchUsed: boolean;
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function mergeSource(
  sources: Map<string, LLMResearchSource>,
  value: ResponseSource,
  cited: boolean,
): void {
  if (!isHttpUrl(value.url)) return;

  const existing = sources.get(value.url);
  sources.set(value.url, {
    url: value.url,
    title: value.title?.trim() || existing?.title,
    cited: cited || existing?.cited || false,
  });
}

export function parseOpenAIResponse(body: unknown): ParsedOpenAIResponse {
  const envelope = body && typeof body === "object" ? (body as ResponsesEnvelope) : {};
  const output = Array.isArray(envelope.output) ? envelope.output : [];
  const textParts: string[] = [];
  const sourceMap = new Map<string, LLMResearchSource>();
  const querySet = new Set<string>();
  let webSearchUsed = false;

  for (const item of output) {
    if (item.type === "web_search_call") {
      webSearchUsed = true;
      if (item.action?.query?.trim()) querySet.add(item.action.query.trim());
      for (const query of item.action?.queries ?? []) {
        if (query.trim()) querySet.add(query.trim());
      }
      for (const source of item.action?.sources ?? []) {
        mergeSource(sourceMap, source, false);
      }
    }

    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) textParts.push(content.text);
      for (const annotation of content.annotations ?? []) {
        if (annotation.type === "url_citation") {
          mergeSource(sourceMap, annotation, true);
        }
      }
    }
  }

  return {
    outputText: textParts.join("\n").trim(),
    sources: [...sourceMap.values()],
    searchQueries: [...querySet],
    webSearchUsed,
  };
}

export function buildWebSearchTool(config: LLMConfig): Record<string, unknown> | null {
  if (!config.webSearchEnabled) return null;

  const filters: Record<string, string[]> = {};
  if (config.allowedDomains.length > 0) filters.allowed_domains = config.allowedDomains;
  if (config.blockedDomains.length > 0) filters.blocked_domains = config.blockedDomains;

  return {
    type: "web_search",
    search_context_size: config.searchContextSize,
    external_web_access: true,
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
  };
}

export async function callResponsesAPI(
  config: LLMConfig,
  request: Record<string, unknown>,
  timeoutMs = 45_000,
): Promise<ParsedOpenAIResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI Responses HTTP ${response.status}: ${detail.slice(0, 300)}`);
    }

    return parseOpenAIResponse(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
