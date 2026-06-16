import { analyzeIndustry } from "@/lib/agent";
import { getLLMConfig, isLLMConfigured } from "@/lib/llm/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
        inference_mode: result.interpretation.inference_mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
