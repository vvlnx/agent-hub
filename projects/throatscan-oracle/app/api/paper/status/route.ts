import { getPaperTradingStatus, listRecentPaperOrders } from "@/lib/paperTrading/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [status, recent_orders] = await Promise.all([
    getPaperTradingStatus(),
    listRecentPaperOrders(10),
  ]);
  return NextResponse.json({
    ...status,
    recent_orders,
  });
}
