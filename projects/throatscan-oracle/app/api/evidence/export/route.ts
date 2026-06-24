import { hydrateBacktestEvidence } from "@/lib/evidenceExport";
import type { BacktestValidation } from "@/lib/backtest";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  let backtest: BacktestValidation;

  try {
    const body = (await request.json()) as { backtest?: BacktestValidation };
    if (!body.backtest?.evidence) {
      return NextResponse.json({ error: "backtest evidence summary is required" }, { status: 400 });
    }
    backtest = body.backtest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const evidence = await hydrateBacktestEvidence(backtest);
    return NextResponse.json({
      ...backtest,
      evidence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evidence export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
