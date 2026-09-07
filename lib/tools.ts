import { currentCatalog } from "@/lib/catalogContext";
import { copyText, cosine, embedText } from "@/lib/embeddings";
import { hybridRank, lexicalTokens } from "@/lib/hybridSearch";
import { MIRROR_PRODUCTS } from "@/lib/mirrorCatalog";
import { getPolicyText, POLICY_TOPICS, type PolicyTopic } from "@/lib/policies";
import { queryPinecone } from "@/lib/pinecone";
import {
  buildSearchText,
  getMagentoBySku,
  getMagentoByUrlKey,
  isMajlisQuery,
  listSaleCategories,
  searchMagento,
  searchMagentoByCategoryIds,
  sessionFor,
  toProductDto,
} from "@/lib/magento";
import { isStoreCode, type StoreCode } from "@/lib/stores";
import { isSofaIntent } from "@/lib/queryUnderstanding";
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

function dtoToCopy(p: ProductDto) {
  return copyText([p.name, p.brand, p.color, p.material, ...p.categories]);
}

function applyHybrid(products: ProductDto[], search: string, room?: string | null, boostSkus?: string[]) {
  if (!products.length) return products;
  const ordered = hybridRank({
    query: search,
    docs: products.map((p) => ({
      sku: p.sku,
      text: dtoToCopy(p),
      inStock: p.stock_status === "IN_STOCK",
    })),
    room,
    boostSkus,
    limit: Math.max(products.length, 10),
  });
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const ranked = ordered.map((sku) => bySku.get(sku)).filter((p): p is ProductDto => Boolean(p));
  return ranked.length ? ranked : products;
}


export async function searchCatalog(
  input: SearchCatalogInput,
): Promise<ToolOk<{ store_code: StoreCode; currency: string; products: ProductDto[] }> | ToolErr> {
  if (!isStoreCode(input.store_code)) return badStore(input.store_code);
  const store = sessionFor(input.store_code);
  const pageSize = Math.min(Math.max(input.page_size ?? 6, 1), 12);
  const sofaIntent = isSofaIntent([input.query, input.room].filter(Boolean).join(" "));
  const baseText = {
    query: input.query,
    brand: input.brand,
    color: sofaIntent ? null : input.color,
    material: sofaIntent ? null : input.material,
    room: input.room,
    category: input.category,
  };
  const queries = [...new Set(buildSearchText(baseText))].slice(0, 3);
  if (sofaIntent && input.color) {
    queries.unshift(`${input.color} sofa`);
  }
  const search = [input.query, ...queries].filter(Boolean).join(" ");
  try {
    const majlis = isMajlisQuery(input.query, input.room);
    const pineconeHits = await queryPinecone(input.store_code, search, 40);
    const batches = await Promise.all(queries.map((query) => searchMagento(store, query, 24)));
    const seen = new Set<string>();
    const raw = [];
    for (const batch of batches) {
      for (const p of batch) {
        if (!seen.has(p.sku)) {
          seen.add(p.sku);
          raw.push(p);
        }
      }
    }
    for (const hit of pineconeHits) {
      if (seen.has(hit.sku) || hit.store_code !== input.store_code) continue;
      const extra = await getMagentoBySku(store, hit.sku);
      if (extra) {
        seen.add(extra.sku);
        raw.push(extra);
      }
    }
    if (currentCatalog() === "mirror") {
      const docs = MIRROR_PRODUCTS.map((p) => ({
        sku: p.sku,
        text: copyText([p.name.en, p.name.ar, p.manufacturer, p.department, ...p.categories.en, ...p.categories.ar]),
        inStock: p.byWebsite[store.website].stock === "IN_STOCK",
      }));
      const vectorSkus = hybridRank({ query: search, docs, room: input.room, boostSkus: input.boost_skus, limit: 16 });
      const qv = embedText(search);
      const qLex = new Set(lexicalTokens(search));
      for (const sku of vectorSkus) {
        if (seen.has(sku)) continue;
        const doc = docs.find((d) => d.sku === sku);
        if (!doc) continue;
        const lexHit = lexicalTokens(doc.text).some((t) => qLex.has(t));
        const vecHit = cosine(qv, embedText(doc.text)) >= 0.22;
        if (!lexHit && !vecHit) continue;
        const extra = await getMagentoBySku(store, sku);
        if (extra) {
          seen.add(extra.sku);
          raw.push(extra);
        }
      }
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
    if (input.color) {
      const c = input.color.toLowerCase();
      const colored = products.filter((p) => `${p.name} ${p.color ?? ""} ${p.categories.join(" ")}`.toLowerCase().includes(c));
      if (colored.length) products = colored;
    }
    if (input.material) {
      const m = input.material.toLowerCase();
      const matted = products.filter((p) => `${p.name} ${p.material ?? ""} ${p.categories.join(" ")}`.toLowerCase().includes(m));
      if (matted.length) products = matted;
    }
    if (majlis) {
      const seating = products.filter((p) => !/dining|طعام|سفرة/i.test([p.name, ...p.categories].join(" ")));
      if (seating.length) products = seating;
    }
    if (sofaIntent) {
      const sofas = products.filter((p) => {
        const hay = [p.name, ...p.categories].join(" ");
        if (/coffee|centre table|center table|dining table|طعام|سفرة/i.test(hay)) return false;
        return /sofa|sectional|loveseat|recliner|كنب|أريكة|اريكة/i.test(hay);
      });
      if (sofas.length) products = sofas;
    }
    products = applyHybrid(products, search, input.room, input.boost_skus);
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

export async function getCurrentPromotions(store_code: StoreCode) {
  if (!isStoreCode(store_code)) return badStore(store_code);
  const store = sessionFor(store_code);
  const [sale, categories] = await Promise.all([
    searchOnSale(store_code, 3),
    listSaleCategories(store_code).catch(() => [] as Array<{ id: number; name: string }>),
  ]);
  return {
    ok: true as const,
    store_code,
    currency: store.currency,
    campaigns: categories.map((c) => c.name),
    products: sale.ok ? sale.products : [],
  };
}

export async function getProductByUrlKey(store_code: StoreCode, url_key: string) {
  if (!isStoreCode(store_code)) return badStore(store_code);
  const store = sessionFor(store_code);
  try {
    const raw = await getMagentoByUrlKey(store, url_key.trim());
    if (!raw) return { ok: false as const, error: "not_found" as const, url_key };
    const product = await toProductDto(store, raw);
    return { ok: true as const, store_code, currency: store.currency, product };
  } catch (err) {
    return { ok: false as const, error: "catalog_unavailable", detail: err instanceof Error ? err.message : "unknown" };
  }
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
