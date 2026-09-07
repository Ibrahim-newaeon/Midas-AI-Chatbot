import { isStoreCode, STORE_MAP, type StoreCode } from "./stores";
import {
  findBySku,
  findByUrlKey,
  magentoItem,
  matchMirrorCategories,
  MIRROR_NAV,
  productsByCategoryId,
  searchMirror,
} from "./mirrorCatalog";

type GqlBody = {
  query?: string;
  variables?: Record<string, unknown>;
};

function localeFor(store: StoreCode) {
  return STORE_MAP[store].language === "ar" ? "ar_SA" : "en_US";
}

export function executeMirrorGraphql(storeHeader: string, body: GqlBody) {
  if (!isStoreCode(storeHeader)) {
    return { errors: [{ message: `Unknown store ${storeHeader}` }] };
  }
  const store = storeHeader;
  const query = body.query ?? "";
  const variables = body.variables ?? {};
  const meta = STORE_MAP[store];
  const lang = meta.language;

  if (query.includes("storeConfig")) {
    return {
      data: {
        storeConfig: {
          store_code: store,
          default_display_currency_code: meta.currency,
          locale: localeFor(store),
        },
      },
    };
  }

  if (query.includes("categoryList")) {
    const name = String(variables.name ?? "");
    const hits = matchMirrorCategories(name).map((cat) => ({
      id: cat.id,
      name: lang === "ar" ? cat.magentoAr : cat.magentoEn,
    }));
    return { data: { categoryList: hits } };
  }

  if (/url_key/.test(query) && ("key" in variables || /url_key:\s*\{\s*eq/.test(query))) {
    const key = String(variables.key ?? "");
    const product = findByUrlKey(key);
    return { data: { products: { items: product ? [magentoItem(store, product)] : [] } } };
  }

  if ((/\$sku\b/.test(query) || /filter:\s*\{\s*sku/.test(query)) && "sku" in variables) {
    const sku = String(variables.sku ?? "");
    const product = findBySku(sku);
    return { data: { products: { items: product ? [magentoItem(store, product)] : [] } } };
  }

  if (/category_id/.test(query)) {
    const ids = (variables.ids as string[] | undefined) ?? [];
    const pageSize = Number(variables.pageSize ?? 12);
    return { data: { products: { items: productsByCategoryId(store, ids, pageSize) } } };
  }

  if (/products\(search/.test(query) || "search" in variables) {
    const search = String(variables.search ?? "furniture");
    const pageSize = Number(variables.pageSize ?? 8);
    return { data: { products: { items: searchMirror(store, search, pageSize) } } };
  }

  return { errors: [{ message: "Unsupported mirror GraphQL query" }] };
}

export { MIRROR_NAV };
