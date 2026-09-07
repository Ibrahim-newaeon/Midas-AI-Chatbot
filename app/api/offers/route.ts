import { NextResponse } from "next/server";
import { isStoreCode } from "@/lib/stores";
import { searchOnSale } from "@/lib/tools";
import { runWithCatalog } from "@/lib/catalogContext";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = url.searchParams.get("store");
  const catalog =
    url.searchParams.get("catalog") === "mirror"
      ? "mirror"
      : url.searchParams.get("catalog") === "import"
        ? "import"
        : "live";
  const tenantId = url.searchParams.get("tenant");
  if (!isStoreCode(store)) {
    return NextResponse.json({ ok: false, error: "invalid_store" }, { status: 400 });
  }
  const result = await runWithCatalog(catalog, () => searchOnSale(store, 3), "widget", tenantId);
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
