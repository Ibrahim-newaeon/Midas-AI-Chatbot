import { NextResponse } from "next/server";
import { getPolicy } from "@/lib/tools";
import { isStoreCode } from "@/lib/stores";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isStoreCode(body.store_code) || !body.topic) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const result = getPolicy(body.store_code, String(body.topic));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
