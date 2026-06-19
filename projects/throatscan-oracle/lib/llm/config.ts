export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  webSearchEnabled: boolean;
  searchContextSize: "low" | "medium" | "high";
  allowedDomains: string[];
  blockedDomains: string[];
}

function parseDomains(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((domain) => domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean)
    .slice(0, 100);
}

function searchContextSize(value: string | undefined): LLMConfig["searchContextSize"] {
  return value === "low" || value === "high" ? value : "medium";
}

export function getLLMConfig(): LLMConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini",
    webSearchEnabled: process.env.OPENAI_WEB_SEARCH?.trim() !== "0",
    searchContextSize: searchContextSize(process.env.OPENAI_SEARCH_CONTEXT_SIZE?.trim()),
    allowedDomains: parseDomains(process.env.OPENAI_WEB_SEARCH_ALLOWED_DOMAINS),
    blockedDomains: parseDomains(process.env.OPENAI_WEB_SEARCH_BLOCKED_DOMAINS),
  };
}

export function isLLMConfigured(): boolean {
  return getLLMConfig() !== null;
}
