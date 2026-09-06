import { pdpUrl, type SessionContext, type StoreCode, STORE_MAP } from "@/lib/stores";
import type { ProductDto, StockStatus } from "@/lib/types";

const GRAPHQL_URL =
  process.env.MAGENTO_GRAPHQL_URL ?? "https://midasfurniture.com/graphql";

const PRODUCT_FIELDS = `
  sku
  name
  url_key
  stock_status
  manufacturer
  categories { name }
  image { url }
  price_range {
    minimum_price {
      regular_price { value currency }
      final_price { value currency }
      discount { percent_off }
    }
  }
`;

type MagentoMoney = { value: number; currency: string };
type MagentoProduct = {
  sku: string;
  name: string;
  url_key: string;
  stock_status: StockStatus | string;
  manufacturer?: string | null;
  categories?: Array<{ name: string } | null> | null;
  image?: { url: string } | null;
  price_range?: {
    minimum_price?: {
      regular_price?: MagentoMoney;
      final_price?: MagentoMoney;
      discount?: { percent_off?: number } | null;
    };
  };
};

async function magentoGraphql<T>(store: StoreCode, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Store: store,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Magento HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) {
    throw new Error("Magento returned no data");
  }
  return json.data;
}

function inferBrand(product: MagentoProduct): string | null {
  if (product.manufacturer) return String(product.manufacturer);
  const cats = (product.categories ?? []).map((c) => c?.name ?? "").join(" ");
  if (/kare/i.test(cats) || /كاري/i.test(cats)) return "Kare Design";
  if (/ashley/i.test(cats) || /آشلي|اشلي/i.test(cats)) return "Ashley";
  return null;
}

export async function toProductDto(store: SessionContext, product: MagentoProduct): Promise<ProductDto> {
  const min = product.price_range?.minimum_price;
  const regular = min?.regular_price?.value ?? 0;
  const final = min?.final_price?.value ?? regular;
  const currency = (min?.final_price?.currency ?? store.currency) as ProductDto["currency"];
  const percent = min?.discount?.percent_off;
  return {
    sku: product.sku,
    name: product.name,
    brand: inferBrand(product),
    image_url: product.image?.url ?? null,
    url_key: product.url_key,
    pdp_url: pdpUrl(store, product.url_key),
    regular_price: regular,
    final_price: final,
    currency,
    discount_percent: percent && percent > 0 ? Math.round(percent) : null,
    stock_status: product.stock_status === "IN_STOCK" ? "IN_STOCK" : "OUT_OF_STOCK",
    categories: (product.categories ?? []).map((c) => c?.name).filter((n): n is string => Boolean(n)),
    color: null,
    material: null,
    dimensions: null,
  };
}

export function sessionFor(store_code: StoreCode): SessionContext {
  return {
    store_code,
    ...STORE_MAP[store_code],
    page_sku: null,
    customer_logged_in: false,
    channel: "web",
  };
}

const MAJLIS_RE = /majlis|diwaniya|ديوان|مجلس/i;
const DINING_RE = /dining|طعام|سفرة|طاولة طعام/i;

export function isMajlisQuery(...parts: Array<string | null | undefined>) {
  return MAJLIS_RE.test(parts.filter(Boolean).join(" "));
}

export function buildSearchText(input: {
  query?: string;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  room?: string | null;
  category?: string | null;
}) {
  const majlis = isMajlisQuery(input.query, input.room, input.category);
  const tokens = [input.query, input.brand, input.color, input.material, input.category, input.room]
    .filter((t): t is string => Boolean(t && t.trim()))
    .join(" ");
  if (majlis) {
    const cleaned = tokens
      .replace(DINING_RE, " ")
      .replace(MAJLIS_RE, " ")
      .replace(/\s+/g, " ")
      .trim();
    return [cleaned, "sofa chair living coffee table centre"].filter(Boolean).join(" ");
  }
  return tokens || "furniture";
}

export async function searchMagento(
  store: SessionContext,
  search: string,
  pageSize = 8,
): Promise<MagentoProduct[]> {
  const data = await magentoGraphql<{ products: { items: MagentoProduct[] } }>(
    store.store_code,
    `query Search($search: String!, $pageSize: Int!) {
      products(search: $search, pageSize: $pageSize) {
        items { ${PRODUCT_FIELDS} }
      }
    }`,
    { search, pageSize },
  );
  return data.products.items ?? [];
}

export async function getMagentoBySku(store: SessionContext, sku: string): Promise<MagentoProduct | null> {
  const data = await magentoGraphql<{ products: { items: MagentoProduct[] } }>(
    store.store_code,
    `query BySku($sku: String!) {
      products(filter: { sku: { eq: $sku } }) {
        items { ${PRODUCT_FIELDS} }
      }
    }`,
    { sku },
  );
  return data.products.items?.[0] ?? null;
}

export async function pingStore(store: StoreCode) {
  return magentoGraphql<{
    storeConfig: { store_code: string; default_display_currency_code: string; locale: string };
  }>(
    store,
    `{ storeConfig { store_code default_display_currency_code locale } }`,
  );
}
