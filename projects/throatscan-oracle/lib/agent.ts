import { runAnalyzePipeline } from "@/lib/analyzePipeline";

export async function analyzeIndustry(industry: string) {
  return runAnalyzePipeline(industry);
}
