import { NextResponse } from "next/server";
import { checkStock } from "@/lib/tools";
import { isStoreCode } from "@/lib/stores";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isStoreCode(body.store_code) || !body.sku) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const result = await checkStock(body.store_code, String(body.sku));
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
