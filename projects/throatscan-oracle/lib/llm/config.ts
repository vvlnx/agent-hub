export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
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
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export function isLLMConfigured(): boolean {
  return getLLMConfig() !== null;
}
