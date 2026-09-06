import { getPolicyText, POLICY_TOPICS, type PolicyTopic } from "@/lib/policies";
import {
  buildSearchText,
  getMagentoBySku,
  isMajlisQuery,
  listSaleCategories,
  searchMagento,
  searchMagentoByCategoryIds,
  sessionFor,
  toProductDto,
} from "@/lib/magento";
import { isStoreCode, type StoreCode } from "@/lib/stores";
import type { ProductDto, SearchCatalogInput, ToolErr, ToolOk } from "@/lib/types";

function badStore(store_code: string): ToolErr {
  return { ok: false, error: "invalid_store", detail: store_code };
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !["the", "and", "for", "with", "this", "have", "something", "like", "هل", "عندكم"].includes(t));
}

function rankProducts(products: ProductDto[], search: string, room?: string | null) {
  const tokens = tokenize(search);
  const majlis = isMajlisQuery(search, room);
  const scored = products.map((p) => {
    const hay = `${p.name} ${p.brand ?? ""} ${p.categories.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 3;
    }
    if (/chair|كرسي/.test(search) && /chair|كرسي/.test(hay)) score += 8;
    if (/sofa|sectional|كنب/.test(search) && /sofa|sectional|recliner|كنب/.test(hay)) score += 8;
    if (/kare|كاري/.test(search) && /kare|كاري/.test(hay)) score += 6;
    if (/ashley|آشلي|اشلي/.test(search) && /ashley|آشلي|اشلي/.test(hay)) score += 6;
    if (majlis) {
      if (/dining|طعام|سفرة/.test(hay)) score -= 12;
      if (/sofa|sectional|recliner|loveseat|chair|coffee|centre|center|كنب|كرسي|وسط/.test(hay)) score += 6;
    }
    if (p.stock_status === "IN_STOCK") score += 1;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0 || tokens.length === 0).map((s) => s.p);
}


export async function searchCatalog(
  input: SearchCatalogInput,
): Promise<ToolOk<{ store_code: StoreCode; currency: string; products: ProductDto[] }> | ToolErr> {
  if (!isStoreCode(input.store_code)) return badStore(input.store_code);
  const store = sessionFor(input.store_code);
  const pageSize = Math.min(Math.max(input.page_size ?? 6, 1), 12);
  const search = buildSearchText(input);
  try {
    const majlis = isMajlisQuery(input.query, input.room);
    const [primary, extra] = await Promise.all([
      searchMagento(store, search, 8),
      majlis ? searchMagento(store, "sofa sectional recliner living", 8) : Promise.resolve([]),
    ]);
    const seen = new Set(primary.map((p) => p.sku));
    const raw = [...primary];
    for (const p of extra) {
      if (!seen.has(p.sku)) raw.push(p);
    }
    let products = await Promise.all(raw.map((p) => toProductDto(store, p)));
    if (input.in_stock_only !== false) {
      products = products.filter((p) => p.stock_status === "IN_STOCK");
    }
    if (input.max_price != null) {
      products = products.filter((p) => p.final_price <= input.max_price!);
    }
    if (input.brand) {
      const b = input.brand.toLowerCase();
      const branded = products.filter((p) => (p.brand ?? "").toLowerCase().includes(b) || p.categories.join(" ").toLowerCase().includes(b));
      if (branded.length) products = branded;
    }
    if (isMajlisQuery(input.query, input.room)) {
      const seating = products.filter((p) => !/dining|طعام|سفرة/i.test([p.name, ...p.categories].join(" ")));
      if (seating.length) products = seating;
    }
    const ranked = rankProducts(products, search, input.room);
    if (ranked.length) products = ranked;
    return {
      ok: true,
      store_code: input.store_code,
      currency: store.currency,
      products: products.slice(0, pageSize),
    };
  } catch (err) {
    return { ok: false, error: "catalog_unavailable", detail: err instanceof Error ? err.message : "unknown" };
  }
}

export async function searchOnSale(store_code: StoreCode, page_size = 3, extraQuery?: string) {
  if (!isStoreCode(store_code)) return badStore(store_code);
  const store = sessionFor(store_code);
  const extra = extraQuery?.trim();
  const bySku = new Map<string, ProductDto>();

  try {
    const categories = await listSaleCategories(store_code);
    if (categories.length) {
      const raw = await searchMagentoByCategoryIds(
        store,
        categories.map((c) => String(c.id)),
        16,
      );
      const mapped = await Promise.all(raw.map((p) => toProductDto(store, p)));
      for (const product of mapped) {
        if (product.stock_status === "IN_STOCK" && product.final_price < product.regular_price) {
          bySku.set(product.sku, product);
        }
      }
    }
  } catch {
    // Fall through to keyword sale search.
  }

  if (bySku.size < page_size) {
    const queries = extra ? [extra] : ["sofa", "dining", "bedroom"];
    const batches = await Promise.all(
      queries.map((query) =>
        searchCatalog({
          store_code,
          query,
          in_stock_only: true,
          page_size: 8,
        }),
      ),
    );
    for (const batch of batches) {
      if (!batch.ok) continue;
      for (const product of batch.products) {
        if (product.final_price < product.regular_price) {
          bySku.set(product.sku, product);
        }
      }
    }
  }

  let products = [...bySku.values()];
  if (extra) {
    const tokens = tokenize(extra);
    const narrowed = products.filter((p) => {
      const hay = `${p.name} ${p.categories.join(" ")}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    });
    if (narrowed.length) products = narrowed;
  }
  products.sort(
    (a, b) => (b.discount_percent ?? 0) - (a.discount_percent ?? 0) || a.final_price - b.final_price,
  );
  if (!products.length) {
    return { ok: false as const, error: "no_sale_items" as const, store_code };
  }
  return {
    ok: true as const,
    store_code,
    currency: store.currency,
    products: products.slice(0, page_size),
  };
}

export async function getProduct(store_code: StoreCode, sku: string) {
  if (!isStoreCode(store_code)) return badStore(store_code);
  const store = sessionFor(store_code);
  try {
    const raw = await getMagentoBySku(store, sku.trim());
    if (!raw) return { ok: false as const, error: "not_found" as const, sku };
    const product = await toProductDto(store, raw);
    return { ok: true as const, store_code, currency: store.currency, product };
  } catch (err) {
    return { ok: false as const, error: "catalog_unavailable", detail: err instanceof Error ? err.message : "unknown" };
  }
}

export async function checkStock(store_code: StoreCode, sku: string) {
  const result = await getProduct(store_code, sku);
  if (!result.ok) return result;
  return {
    ok: true as const,
    store_code,
    sku: result.product.sku,
    stock_status: result.product.stock_status,
    qty: null as number | null,
    product: result.product,
  };
}

export function getPolicy(store_code: StoreCode, topic: string) {
  if (!isStoreCode(store_code)) return badStore(store_code);
  if (!POLICY_TOPICS.includes(topic as PolicyTopic)) {
    return { ok: false as const, error: "unknown_topic", detail: topic };
  }
  const store = sessionFor(store_code);
  return {
    ok: true as const,
    store_code,
    topic: topic as PolicyTopic,
    text: getPolicyText(store.website, topic as PolicyTopic, store.language),
  };
}

export async function visualSearch(input: {
  store_code: StoreCode;
  user_note?: string;
  vision_query?: string;
}) {
  const query = [input.vision_query, input.user_note].filter(Boolean).join(" ").trim() || "accent chair furniture";
  const result = await searchCatalog({
    store_code: input.store_code,
    query,
    room: /majlis|مجلس/.test(query) ? "majlis" : null,
    in_stock_only: true,
    page_size: 3,
  });
  if (!result.ok) return result;
  return {
    ...result,
    vision: { query, source: input.vision_query ? "vision" : "text" },
    products: result.products.map((p) => ({ ...p, match_type: "style" as const })),
  };
}
