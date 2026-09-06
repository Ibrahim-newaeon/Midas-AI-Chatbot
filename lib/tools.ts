import { getPolicyText, POLICY_TOPICS, type PolicyTopic } from "@/lib/policies";
import {
  buildSearchText,
  getMagentoBySku,
  isMajlisQuery,
  searchMagento,
  sessionFor,
  toProductDto,
} from "@/lib/magento";
import { isStoreCode, type StoreCode } from "@/lib/stores";
import type { ProductDto, SearchCatalogInput, ToolErr, ToolOk } from "@/lib/types";

function badStore(store_code: string): ToolErr {
  return { ok: false, error: "invalid_store", detail: store_code };
}

export async function searchCatalog(
  input: SearchCatalogInput,
): Promise<ToolOk<{ store_code: StoreCode; currency: string; products: ProductDto[] }> | ToolErr> {
  if (!isStoreCode(input.store_code)) return badStore(input.store_code);
  const store = sessionFor(input.store_code);
  const pageSize = Math.min(Math.max(input.page_size ?? 6, 1), 12);
  const search = buildSearchText(input);
  try {
    const raw = await searchMagento(store, search, pageSize * 2);
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
