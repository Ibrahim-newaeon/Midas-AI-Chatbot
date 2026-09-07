import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ProductDto, SearchCatalogInput } from "./types";
import { currentTenantId } from "./catalogContext";
import { withMidasAiUtm } from "./utm";

export type TenantSource = "csv" | "rest";

export type TenantRecord = {
  id: string;
  name: string;
  storeUrl: string;
  language: "en" | "ar";
  currency: string;
  source: TenantSource;
  restUrl: string | null;
  productCount: number;
  updatedAt: string;
};

export type ImportedRow = {
  sku: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  url: string;
  url_key: string;
  regular_price: number;
  final_price: number;
  currency: string;
  stock_status: "IN_STOCK" | "OUT_OF_STOCK";
  categories: string[];
  color: string | null;
  material: string | null;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const INDEX_FILE = path.join(DATA_DIR, "tenants.json");
const CATALOG_DIR = path.join(DATA_DIR, "tenant-catalogs");

function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug || `store-${Date.now().toString(36)}`;
}

function urlKeyFromUrl(url: string, sku: string) {
  try {
    const parsed = new URL(url, "https://example.com");
    const last = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    return last.replace(/\.html$/i, "") || sku;
  } catch {
    return sku;
  }
}

export function parseCsv(text: string): ImportedRow[] {
  const rows = splitCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const idx = (aliases: string[]) => {
    for (const alias of aliases) {
      const i = header.indexOf(alias);
      if (i >= 0) return i;
    }
    return -1;
  };
  const skuI = idx(["sku", "id", "product_id"]);
  const nameI = idx(["name", "title", "product"]);
  if (skuI < 0 || nameI < 0) {
    throw new Error("CSV needs sku and name columns.");
  }
  const priceI = idx(["price", "final_price", "sale_price"]);
  const regularI = idx(["regular_price", "was_price", "list_price"]);
  const urlI = idx(["url", "pdp_url", "product_url", "link"]);
  const imageI = idx(["image", "image_url", "img"]);
  const stockI = idx(["stock", "stock_status", "availability"]);
  const currencyI = idx(["currency", "curr"]);
  const brandI = idx(["brand", "manufacturer"]);
  const catI = idx(["category", "categories"]);
  const colorI = idx(["color", "colour"]);
  const materialI = idx(["material", "fabric"]);

  const out: ImportedRow[] = [];
  for (const cols of rows.slice(1)) {
    const sku = (cols[skuI] ?? "").trim();
    const name = (cols[nameI] ?? "").trim();
    if (!sku || !name) continue;
    const final = Number(String(cols[priceI] ?? "0").replace(/[^0-9.]/g, "")) || 0;
    const regularRaw = regularI >= 0 ? Number(String(cols[regularI] ?? "").replace(/[^0-9.]/g, "")) : 0;
    const regular = regularRaw > 0 ? regularRaw : final;
    const url = (urlI >= 0 ? cols[urlI] : "")?.trim() || `#sku-${sku}`;
    const stockRaw = (stockI >= 0 ? cols[stockI] : "IN_STOCK")?.toString().trim().toUpperCase() ?? "IN_STOCK";
    const inStock = !["0", "OUT", "OUT_OF_STOCK", "OOS", "FALSE", "NO", "N"].includes(stockRaw);
    const categories = (catI >= 0 ? cols[catI] : "")
      ?.split(/[|,]/)
      .map((c) => c.trim())
      .filter(Boolean);
    out.push({
      sku,
      name,
      brand: (brandI >= 0 ? cols[brandI] : "")?.trim() || null,
      image_url: (imageI >= 0 ? cols[imageI] : "")?.trim() || null,
      url,
      url_key: urlKeyFromUrl(url, sku),
      regular_price: regular,
      final_price: final,
      currency: (currencyI >= 0 ? cols[currencyI] : "")?.trim().toUpperCase() || "",
      stock_status: inStock ? "IN_STOCK" : "OUT_OF_STOCK",
      categories: categories ?? [],
      color: (colorI >= 0 ? cols[colorI] : "")?.trim() || null,
      material: (materialI >= 0 ? cols[materialI] : "")?.trim() || null,
    });
  }
  return out;
}

function splitCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      if (row.some((c) => c.trim())) lines.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch !== "\r") cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) lines.push(row);
  return lines;
}

export function normalizeRestPayload(payload: unknown, fallbackCurrency: string): ImportedRow[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { products?: unknown }).products)
      ? (payload as { products: unknown[] }).products
      : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
        ? (payload as { items: unknown[] }).items
        : null;
  if (!list) {
    throw new Error("REST JSON must be an array, or { products: [] } / { items: [] }.");
  }
  return list
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      const pick = (...keys: string[]) => {
        for (const k of keys) {
          const v = o[k];
          if (v != null && String(v).trim()) return String(v).trim();
        }
        return "";
      };
      const sku = pick("sku", "id", "product_id");
      const name = pick("name", "title", "product");
      if (!sku || !name) return null;
      const final = Number(String(pick("final_price", "price", "sale_price")).replace(/[^0-9.]/g, "")) || 0;
      const regular = Number(String(pick("regular_price", "was_price", "list_price")).replace(/[^0-9.]/g, "")) || final;
      const url = pick("url", "pdp_url", "product_url", "link") || `#sku-${sku}`;
      const stockRaw = pick("stock_status", "stock", "availability").toUpperCase();
      const inStock = !stockRaw || !["0", "OUT", "OUT_OF_STOCK", "OOS", "FALSE", "NO"].includes(stockRaw);
      const cats = pick("category", "categories");
      return {
        sku,
        name,
        brand: pick("brand", "manufacturer") || null,
        image_url: pick("image_url", "image", "img") || null,
        url,
        url_key: urlKeyFromUrl(url, sku),
        regular_price: regular,
        final_price: final,
        currency: pick("currency").toUpperCase() || fallbackCurrency,
        stock_status: inStock ? ("IN_STOCK" as const) : ("OUT_OF_STOCK" as const),
        categories: cats ? cats.split(/[|,]/).map((c) => c.trim()).filter(Boolean) : [],
        color: pick("color", "colour") || null,
        material: pick("material", "fabric") || null,
      } satisfies ImportedRow;
    })
    .filter((row): row is ImportedRow => Boolean(row));
}

async function loadIndex(): Promise<TenantRecord[]> {
  try {
    const raw = await readFile(INDEX_FILE, "utf8");
    const parsed = JSON.parse(raw) as TenantRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveIndex(rows: TenantRecord[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(INDEX_FILE, JSON.stringify(rows, null, 2));
}

async function saveProducts(id: string, products: ImportedRow[]) {
  await mkdir(CATALOG_DIR, { recursive: true });
  await writeFile(path.join(CATALOG_DIR, `${id}.json`), JSON.stringify(products));
}

export async function listTenants(): Promise<TenantRecord[]> {
  const rows = await loadIndex();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTenant(id: string): Promise<TenantRecord | null> {
  return (await loadIndex()).find((t) => t.id === id) ?? null;
}

export async function loadTenantProducts(id: string): Promise<ImportedRow[]> {
  try {
    const raw = await readFile(path.join(CATALOG_DIR, `${id}.json`), "utf8");
    const parsed = JSON.parse(raw) as ImportedRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function upsertTenant(input: {
  name: string;
  storeUrl: string;
  language: "en" | "ar";
  currency: string;
  source: TenantSource;
  restUrl?: string | null;
  products: ImportedRow[];
}): Promise<TenantRecord> {
  if (!input.products.length) {
    throw new Error("No products imported. Check the CSV columns or REST JSON.");
  }
  const currency = input.currency.trim().toUpperCase() || "USD";
  const products = input.products.map((p) => ({
    ...p,
    currency: p.currency || currency,
  }));
  const index = await loadIndex();
  let id = slugify(input.name);
  const existing = index.find((t) => t.id === id);
  if (existing && existing.name.toLowerCase() !== input.name.trim().toLowerCase()) {
    id = `${id}-${Date.now().toString(36).slice(-4)}`;
  }
  const record: TenantRecord = {
    id,
    name: input.name.trim(),
    storeUrl: input.storeUrl.trim(),
    language: input.language,
    currency,
    source: input.source,
    restUrl: input.restUrl?.trim() || null,
    productCount: products.length,
    updatedAt: new Date().toISOString(),
  };
  const next = index.filter((t) => t.id !== id);
  next.push(record);
  await saveIndex(next);
  await saveProducts(id, products);
  return record;
}

function toDto(row: ImportedRow, channel: string): ProductDto {
  const currency = (row.currency || "USD") as ProductDto["currency"];
  return {
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    image_url: row.image_url,
    url_key: row.url_key,
    pdp_url: withMidasAiUtm(row.url, channel),
    regular_price: row.regular_price,
    final_price: row.final_price,
    currency,
    discount_percent:
      row.regular_price > row.final_price && row.regular_price > 0
        ? Math.round((1 - row.final_price / row.regular_price) * 100)
        : null,
    stock_status: row.stock_status,
    categories: row.categories,
    color: row.color,
    material: row.material,
    dimensions: null,
    fetched_at: new Date().toISOString(),
  };
}

function matchesQuery(row: ImportedRow, q: string) {
  if (!q.trim()) return true;
  const hay = `${row.name} ${row.brand ?? ""} ${row.categories.join(" ")} ${row.color ?? ""} ${row.material ?? ""} ${row.sku}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .every((t) => hay.includes(t));
}

export async function searchImported(input: SearchCatalogInput, channel = "widget"): Promise<ProductDto[]> {
  const tenantId = currentTenantId();
  if (!tenantId) return [];
  const tenant = await getTenant(tenantId);
  const rows = await loadTenantProducts(tenantId);
  let list = rows.filter((row) => matchesQuery(row, input.query ?? ""));
  if (input.brand) list = list.filter((r) => (r.brand ?? "").toLowerCase().includes(input.brand!.toLowerCase()));
  if (input.color) list = list.filter((r) => `${r.name} ${r.color ?? ""}`.toLowerCase().includes(input.color!.toLowerCase()));
  if (input.material) {
    list = list.filter((r) => `${r.name} ${r.material ?? ""}`.toLowerCase().includes(input.material!.toLowerCase()));
  }
  if (input.category) {
    list = list.filter((r) => r.categories.join(" ").toLowerCase().includes(input.category!.toLowerCase()));
  }
  if (input.room) {
    list = list.filter((r) => `${r.name} ${r.categories.join(" ")}`.toLowerCase().includes(input.room!.toLowerCase()));
  }
  if (input.in_stock_only !== false) list = list.filter((r) => r.stock_status === "IN_STOCK");
  if (input.max_price != null) list = list.filter((r) => r.final_price <= input.max_price!);
  const currency = tenant?.currency;
  return list.slice(0, input.page_size ?? 6).map((row) => toDto({ ...row, currency: row.currency || currency || "USD" }, channel));
}

export async function getImportedBySku(sku: string, channel = "widget"): Promise<ProductDto | null> {
  const tenantId = currentTenantId();
  if (!tenantId) return null;
  const tenant = await getTenant(tenantId);
  const row = (await loadTenantProducts(tenantId)).find((p) => p.sku === sku.trim());
  if (!row) return null;
  return toDto({ ...row, currency: row.currency || tenant?.currency || "USD" }, channel);
}

export async function getImportedByUrlKey(urlKey: string, channel = "widget"): Promise<ProductDto | null> {
  const tenantId = currentTenantId();
  if (!tenantId) return null;
  const tenant = await getTenant(tenantId);
  const key = urlKey.trim().replace(/\.html$/i, "");
  const row = (await loadTenantProducts(tenantId)).find((p) => p.url_key === key || p.url.includes(key));
  if (!row) return null;
  return toDto({ ...row, currency: row.currency || tenant?.currency || "USD" }, channel);
}

export async function importedOnSale(pageSize = 3, channel = "widget"): Promise<ProductDto[]> {
  const tenantId = currentTenantId();
  if (!tenantId) return [];
  const tenant = await getTenant(tenantId);
  const rows = (await loadTenantProducts(tenantId)).filter(
    (p) => p.stock_status === "IN_STOCK" && p.final_price < p.regular_price,
  );
  return rows
    .slice(0, pageSize)
    .map((row) => toDto({ ...row, currency: row.currency || tenant?.currency || "USD" }, channel));
}

export async function fetchRestCatalog(url: string, token?: string | null, fallbackCurrency = "USD"): Promise<ImportedRow[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`REST HTTP ${res.status}`);
  const json: unknown = await res.json();
  return normalizeRestPayload(json, fallbackCurrency);
}
