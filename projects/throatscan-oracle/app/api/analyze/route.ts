import { analyzeIndustry } from "@/lib/agent";
import { getLLMConfig, isLLMConfigured } from "@/lib/llm/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let industry = "";

  try {
    const body = (await request.json()) as { industry?: string };
    industry = body.industry?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!industry) {
    return NextResponse.json({ error: "Industry input is required" }, { status: 400 });
  }

  try {
    const result = await analyzeIndustry(industry);
    const llmConfig = getLLMConfig();
    return NextResponse.json({
      ...result,
      meta: {
        llm_enabled: result.interpretation.inference_mode === "constrained_llm",
        llm_configured: isLLMConfigured(),
        llm_requested: process.env.THROATSCAN_LLM?.trim() === "1",
        llm_model: llmConfig?.model,
        llm_api: "responses" as const,
        llm_web_search_enabled: llmConfig?.webSearchEnabled ?? false,
        llm_web_search_used: result.interpretation.web_search_used ?? false,
        llm_source_count: result.interpretation.research_sources?.length ?? 0,
        inference_mode: result.interpretation.inference_mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
