import { submitPaperBasket } from "@/lib/paperTrading/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    run_id?: string;
    industry?: string;
    tickers?: string[];
    rationale?: string;
    quote_size_usdt?: number;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const run_id = body.run_id?.trim();
  const industry = body.industry?.trim() ?? "Unknown industry";
  const tickers = Array.isArray(body.tickers) ? body.tickers.filter(Boolean) : [];
  const rationale = body.rationale?.trim() ?? "Paper basket from ThroatScan simulated decision";

  if (!run_id) {
    return NextResponse.json({ error: "run_id is required" }, { status: 400 });
  }
  if (tickers.length === 0) {
    return NextResponse.json({ error: "At least one ticker is required" }, { status: 400 });
  }

  try {
    const result = await submitPaperBasket({
      run_id,
      industry,
      tickers,
      rationale,
      quote_size_usdt: body.quote_size_usdt,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paper order failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
