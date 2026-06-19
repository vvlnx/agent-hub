import { getPaperTradingStatus, listRecentPaperOrders } from "@/lib/paperTrading/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getPaperTradingStatus();
  return NextResponse.json({
    ...status,
    recent_orders: listRecentPaperOrders(10),
  });
}
