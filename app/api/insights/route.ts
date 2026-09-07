import { merchandisingInsight } from "@/lib/learningQueue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const insight = await merchandisingInsight();
  return NextResponse.json({ ok: true, ...insight });
}
