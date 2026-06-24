import { runAnalyzePipeline, type AnalysisProgressEvent } from "@/lib/analyzePipeline";
import { slimAnalysisForClient } from "@/lib/analyzeResponse";
import { getLLMConfig, isLLMConfigured } from "@/lib/llm/config";
import type { AnalysisResult } from "@/lib/mockData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let industry = "";

  try {
    const body = (await request.json()) as { industry?: string };
    industry = body.industry?.trim() ?? "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!industry) {
    return new Response(JSON.stringify({ error: "Industry input is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const push = (chunk: string): void => {
        controller.enqueue(encoder.encode(chunk));
      };

      void (async () => {
        try {
          const result = await runAnalyzePipeline(industry, (event: AnalysisProgressEvent) => {
            push(encodeSse("progress", event));
          });

          const llmConfig = getLLMConfig();
          const payload: AnalysisResult & { meta: NonNullable<AnalysisResult["meta"]> } = {
            ...slimAnalysisForClient(result),
            meta: {
              llm_enabled: result.interpretation.inference_mode === "constrained_llm",
              llm_configured: isLLMConfigured(),
              llm_requested: process.env.THROATSCAN_LLM?.trim() === "1",
              llm_model: llmConfig?.model,
              llm_api: "responses",
              llm_web_search_enabled: llmConfig?.webSearchEnabled ?? false,
              llm_web_search_used: result.interpretation.web_search_used ?? false,
              llm_source_count: result.interpretation.research_sources?.length ?? 0,
              inference_mode: result.interpretation.inference_mode,
            },
          };

          push(encodeSse("result", { result: payload, meta: payload.meta }));
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Analysis failed";
          push(encodeSse("error", { error: message }));
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
