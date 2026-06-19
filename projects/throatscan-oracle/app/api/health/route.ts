import { warmBitgetPublicCache } from "@/lib/bitgetCache";
import { getPaperTradingStatus } from "@/lib/paperTrading/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MARKET_DATA_MCP_URL =
  process.env.MARKET_DATA_MCP_URL?.trim() || "https://datahub.noxiaohao.com/mcp";

async function probeMcp(): Promise<{ ok: boolean; latency_ms?: number; error?: string }> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(MARKET_DATA_MCP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "throatscan-health", version: "1.0.0" },
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    return {
      ok: response.ok,
      latency_ms: Date.now() - started,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      latency_ms: Date.now() - started,
      error: error instanceof Error ? error.message : "MCP probe failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const started = Date.now();
  const [bitget, paper, mcp] = await Promise.all([
    warmBitgetPublicCache(),
    getPaperTradingStatus(),
    probeMcp(),
  ]);

  return NextResponse.json({
    ok: bitget.symbols && paper.public_market_live,
    service: "throatscan-oracle",
    checked_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    bitget_public: bitget,
    paper_trading: paper,
    agent_hub_mcp: mcp,
    demo_url: process.env.THROATSCAN_PUBLIC_DEMO_URL ?? null,
  });
}
