import { NextResponse } from "next/server";
import {
  fetchRestCatalog,
  getTenant,
  listTenants,
  parseCsv,
  upsertTenant,
} from "@/lib/importedCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tenants = await listTenants();
  return NextResponse.json({ ok: true, tenants });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const storeUrl = String(form.get("storeUrl") ?? "").trim();
    const language = form.get("language") === "ar" ? "ar" : "en";
    const currency = String(form.get("currency") ?? "USD").trim().toUpperCase() || "USD";
    const source = form.get("source") === "rest" ? "rest" : "csv";
    if (!name || !storeUrl) {
      return NextResponse.json({ ok: false, error: "Client name and store URL are required." }, { status: 400 });
    }

    if (source === "rest") {
      const restUrlRaw = String(form.get("restUrl") ?? "").trim();
      const token = String(form.get("restToken") ?? "").trim() || null;
      if (!restUrlRaw) {
        return NextResponse.json({ ok: false, error: "REST products URL is required." }, { status: 400 });
      }
      const restUrl = restUrlRaw.startsWith("/") ? new URL(restUrlRaw, req.url).toString() : restUrlRaw;
      const products = await fetchRestCatalog(restUrl, token, currency);
      const tenant = await upsertTenant({ name, storeUrl, language, currency, source: "rest", restUrl, products });
      return NextResponse.json({ ok: true, tenant, preview: products.slice(0, 8) });
    }

    const file = form.get("csv");
    if (!(file instanceof File) || file.size < 8) {
      return NextResponse.json({ ok: false, error: "Upload a CSV with sku and name columns." }, { status: 400 });
    }
    const text = await file.text();
    const products = parseCsv(text);
    const tenant = await upsertTenant({ name, storeUrl, language, currency, source: "csv", products });
    return NextResponse.json({ ok: true, tenant, preview: products.slice(0, 8) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Import failed." },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  const tenant = await getTenant(id);
  if (!tenant?.restUrl) {
    return NextResponse.json({ ok: false, error: "This store has no REST URL to refresh." }, { status: 400 });
  }
  try {
    const products = await fetchRestCatalog(tenant.restUrl, null, tenant.currency);
    const updated = await upsertTenant({
      name: tenant.name,
      storeUrl: tenant.storeUrl,
      language: tenant.language,
      currency: tenant.currency,
      source: "rest",
      restUrl: tenant.restUrl,
      products,
    });
    return NextResponse.json({ ok: true, tenant: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Refresh failed." },
      { status: 400 },
    );
  }
}
