import type { AnalysisResult } from "./mockData";
import type { AnalysisProgressEvent } from "./analyzePipeline";

export interface AnalyzeStreamResultPayload {
  result: AnalysisResult;
  meta?: AnalysisResult["meta"];
}

export interface AnalyzeStreamErrorPayload {
  error: string;
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n").filter(Boolean);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

export async function consumeAnalyzeStream(
  industry: string,
  handlers: {
    onProgress?: (event: AnalysisProgressEvent) => void;
    signal?: AbortSignal;
  },
): Promise<AnalyzeStreamResultPayload & { meta?: AnalysisResult["meta"] }> {
  const response = await fetch("/api/analyze/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ industry }),
    signal: handlers.signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as AnalyzeStreamErrorPayload;
    throw new Error(payload.error ?? `Analysis failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error("Analysis stream unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (!parsed) continue;

      if (parsed.event === "progress") {
        handlers.onProgress?.(JSON.parse(parsed.data) as AnalysisProgressEvent);
        continue;
      }

      if (parsed.event === "error") {
        const payload = JSON.parse(parsed.data) as AnalyzeStreamErrorPayload;
        throw new Error(payload.error);
      }

      if (parsed.event === "result") {
        return JSON.parse(parsed.data) as AnalyzeStreamResultPayload;
      }
    }
  }

  throw new Error("Analysis stream ended without a result");
}
