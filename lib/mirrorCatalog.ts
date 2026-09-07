import { STORE_MAP, type StoreCode, type WebsiteId } from "./stores";

export type MirrorStock = "IN_STOCK" | "OUT_OF_STOCK";

export type MirrorPrice = {
  regular: number;
  final: number;
  stock: MirrorStock;
};

export type MirrorProduct = {
  sku: string;
  url_key: string;
  manufacturer: string;
  image_url: string;
  name: { en: string; ar: string };
  categories: { en: string[]; ar: string[] };
  byWebsite: Record<WebsiteId, MirrorPrice>;
};

/** Demo-only prices per website. Not FX conversions of each other. */
export const MIRROR_PRODUCTS: MirrorProduct[] = [
  {
    sku: "154534",
    url_key: "londer-bedroom-set-king-size-193-203-cm-bedrooms-midas",
    manufacturer: "Ashley",
    image_url:
      "https://midasfurniture.com/media/catalog/product/1/5/154534.webp?optimize=high&fit=bounds&height=&width=",
    name: {
      en: "LONDER BEDROOM SET KING SIZE (193*203 CM) BLACK",
      ar: "طقم غرفة نوم لوندر كينج (193*203 سم) أسود",
    },
    categories: {
      en: ["Home Furniture", "Bedrooms", "King Size Bedroom Sets", "Ashley Homestore", "Exclusive Deals"],
      ar: ["أثاث منزلي", "غرف نوم", "أطقم غرف نوم كينج", "Ashley Homestore", "عروض حصرية"],
    },
    byWebsite: {
      kuwait: { regular: 995, final: 495, stock: "IN_STOCK" },
      qatar: { regular: 3900, final: 2100, stock: "IN_STOCK" },
      ksa: { regular: 4280, final: 2490, stock: "IN_STOCK" },
      jordan: { regular: 355, final: 189, stock: "OUT_OF_STOCK" },
      bahrain: { regular: 118, final: 64, stock: "IN_STOCK" },
    },
  },
  {
    sku: "170423",
    url_key: "ovalo-velvet-sectional-sofa-7-pcs-white-living-room-midas",
    manufacturer: "Ashley",
    image_url:
      "https://midasfurniture.com/media/catalog/product/1/1/11-170423_n.webp?optimize=high&fit=bounds&height=&width=",
    name: {
      en: "OVALO VELVET SECTIONAL SOFA 7 PCS WHITE",
      ar: "كنب أوفالو مخمل مقطعي 7 قطع أبيض",
    },
    categories: {
      en: ["Home Furniture", "Living Rooms", "Sofas", "Sectional Sofas", "Exclusive Deals"],
      ar: ["أثاث منزلي", "غرف معيشة", "كنب", "كنب مقطعي", "عروض حصرية"],
    },
    byWebsite: {
      kuwait: { regular: 1645, final: 1395, stock: "IN_STOCK" },
      qatar: { regular: 6200, final: 4980, stock: "IN_STOCK" },
      ksa: { regular: 7100, final: 5750, stock: "IN_STOCK" },
      jordan: { regular: 590, final: 475, stock: "IN_STOCK" },
      bahrain: { regular: 198, final: 159, stock: "IN_STOCK" },
    },
  },
];

export const MIRROR_SALE_CATEGORY = {
  id: 96,
  en: "Exclusive Deals",
  ar: "عروض حصرية",
};

export function magentoItem(store: StoreCode, product: MirrorProduct) {
  const meta = STORE_MAP[store];
  const price = product.byWebsite[meta.website];
  const lang = meta.language;
  const percent =
    price.regular > price.final ? Math.round((1 - price.final / price.regular) * 1000) / 10 : 0;
  return {
    sku: product.sku,
    name: product.name[lang],
    url_key: product.url_key,
    stock_status: price.stock,
    manufacturer: product.manufacturer,
    categories: product.categories[lang].map((name) => ({ name })),
    image: { url: product.image_url },
    price_range: {
      minimum_price: {
        regular_price: { value: price.regular, currency: meta.currency },
        final_price: { value: price.final, currency: meta.currency },
        discount: { percent_off: percent },
      },
    },
  };
}

export function findBySku(sku: string) {
  return MIRROR_PRODUCTS.find((p) => p.sku === sku) ?? null;
}

export function findByUrlKey(urlKey: string) {
  const key = urlKey.replace(/\.html$/i, "").replace(/\/+$/, "");
  return MIRROR_PRODUCTS.find((p) => p.url_key === key) ?? null;
}

export function searchMirror(store: StoreCode, search: string, pageSize = 8) {
  const q = search.toLowerCase();
  const lang = STORE_MAP[store].language;
  const hits = MIRROR_PRODUCTS.filter((p) => {
    const hay = `${p.sku} ${p.url_key} ${p.name.en} ${p.name.ar} ${p.categories[lang].join(" ")} ${p.manufacturer}`.toLowerCase();
    return q.split(/\s+/).filter((t) => t.length > 1).some((t) => hay.includes(t)) || hay.includes(q);
  });
  return hits.slice(0, pageSize).map((p) => magentoItem(store, p));
}
