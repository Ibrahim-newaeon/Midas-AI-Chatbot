/**
 * “Load that piece” = Magento identity lookup by `url_key`.
 * A pasted PDP is not a search query. The slug identifies one product;
 * we must not tokenize “king size bedroom set” and return similar SKUs.
 */
type StoreCode =
  | "en"
  | "ar"
  | "qtr_en"
  | "qtr_ar"
  | "ksa_en"
  | "ksa_ar"
  | "jo_en"
  | "jo_ar"
  | "bhr_en"
  | "bhr_ar";

const STORE_PREFIXES = new Set<string>([
  "en",
  "ar",
  "qtr_en",
  "qtr_ar",
  "ksa_en",
  "ksa_ar",
  "jo_en",
  "jo_ar",
  "bhr_en",
  "bhr_ar",
]);

const MIDAS_LINK = /https?:\/\/(?:www\.)?midasfurniture\.com\/([^\s?#]+)/i;

const NOT_PRODUCT = new Set([
  ...STORE_PREFIXES,
  "kuwait",
  "qatar",
  "ksa",
  "jordan",
  "bahrain",
  "faq_kuwait",
  "checkout",
  "cart",
  "customer",
]);

export type ParsedMidasLink = {
  store_code: StoreCode | null;
  url_key: string;
  raw: string;
};

function isStorePrefix(value: string): value is StoreCode {
  return STORE_PREFIXES.has(value);
}

export function parseMidasProductUrl(text: string): ParsedMidasLink | null {
  const match = text.match(MIDAS_LINK);
  if (!match) return null;
  const path = match[1].replace(/\/+$/, "").replace(/\.html$/i, "");
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return null;

  let store_code: StoreCode | null = null;
  let slugParts = parts;
  if (isStorePrefix(parts[0])) {
    store_code = parts[0];
    slugParts = parts.slice(1);
  }
  const url_key = slugParts.join("/").split("/").pop() ?? "";
  if (!url_key || NOT_PRODUCT.has(url_key.toLowerCase()) || url_key.length < 4) return null;
  return { store_code, url_key, raw: match[0] };
}
