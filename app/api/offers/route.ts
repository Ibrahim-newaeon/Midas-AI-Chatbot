import { NextResponse } from "next/server";
import { isStoreCode } from "@/lib/stores";
import { searchOnSale } from "@/lib/tools";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const store = new URL(req.url).searchParams.get("store");
  if (!isStoreCode(store)) {
    return NextResponse.json({ ok: false, error: "invalid_store" }, { status: 400 });
  }
  const result = await searchOnSale(store, 3);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, products: [] });
  }
  return NextResponse.json({
    ok: true,
    store_code: result.store_code,
    currency: result.currency,
    products: result.products,
  });
}
