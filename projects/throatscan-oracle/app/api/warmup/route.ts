import { warmBitgetPublicCache } from "@/lib/bitgetCache";
import { loadEquityCatalog } from "@/lib/equity";
import { getPaperTradingStatus, listRecentPaperOrders } from "@/lib/paperTrading/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const bitget = await warmBitgetPublicCache();
  const equityCatalog = await loadEquityCatalog();
  const [paper_status, recent_orders] = await Promise.all([
    getPaperTradingStatus(),
    listRecentPaperOrders(20),
  ]);

  return NextResponse.json({
    ok: bitget.symbols,
    warmed_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    bitget,
    equity_catalog: equityCatalog.snapshot,
    paper_status,
    recent_orders,
  });
}
