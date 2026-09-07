import { NextResponse } from "next/server";
import { executeMirrorGraphql } from "@/lib/mirrorGraphql";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const store = req.headers.get("Store") || req.headers.get("store") || "en";
  let body: { query?: string; variables?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: [{ message: "INVALID_JSON" }] }, { status: 400 });
  }
  const result = executeMirrorGraphql(store, body);
  return NextResponse.json(result, { status: "errors" in result ? 400 : 200 });
}
