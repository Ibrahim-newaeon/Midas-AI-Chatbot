import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/tools";
import { isStoreCode } from "@/lib/stores";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isStoreCode(body.store_code)) {
    return NextResponse.json({ ok: false, error: "invalid_store" }, { status: 400 });
  }
  const result = await searchCatalog(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
