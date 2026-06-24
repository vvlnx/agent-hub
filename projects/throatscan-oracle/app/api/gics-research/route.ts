import { buildGicsResearch } from "@/lib/gics/research";
import type { Company } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      industryQuery?: string;
      focusTickers?: string[];
      companies?: Company[];
    };

    const industryQuery = body.industryQuery?.trim();
    if (!industryQuery) {
      return NextResponse.json({ error: "industryQuery is required" }, { status: 400 });
    }

    const research = await buildGicsResearch({
      industryQuery,
      companies: body.companies ?? [],
      focusTickers: body.focusTickers,
    });

    return NextResponse.json(research);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GICS research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
