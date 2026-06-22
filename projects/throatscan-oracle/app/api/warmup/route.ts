import { warmBitgetPublicCache } from "@/lib/bitgetCache";
import { loadEquityCatalog } from "@/lib/equity";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const bitget = await warmBitgetPublicCache();
  const equityCatalog = await loadEquityCatalog();

  return NextResponse.json({
    ok: bitget.symbols,
    warmed_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    bitget,
    equity_catalog: equityCatalog.snapshot,
  });
}
