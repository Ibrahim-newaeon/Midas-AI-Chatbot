/**
 * Resolve Midas AI session JSON from the Magento storefront.
 *
 * Primary signal: Magento "Add Store Code to URLs" (already on).
 *   var BASE_URL = 'https://midasfurniture.com/en/';
 *   var BASE_URL = 'https://midasfurniture.com/ksa_en/';
 *
 * Fallback: Magento `store` cookie, then URL path.
 * Do not use PHPSESSID as a store code.
 */
const STORE_MAP = {
  en:     { website: "kuwait",  language: "en", currency: "KWD", base_path: "/en/" },
  ar:     { website: "kuwait",  language: "ar", currency: "KWD", base_path: "/ar/" },
  qtr_en: { website: "qatar",   language: "en", currency: "QAR", base_path: "/qtr_en/" },
  qtr_ar: { website: "qatar",   language: "ar", currency: "QAR", base_path: "/qtr_ar/" },
  ksa_en: { website: "ksa",     language: "en", currency: "SAR", base_path: "/ksa_en/" },
  ksa_ar: { website: "ksa",     language: "ar", currency: "SAR", base_path: "/ksa_ar/" },
  jo_en:  { website: "jordan",  language: "en", currency: "JOD", base_path: "/jo_en/" },
  jo_ar:  { website: "jordan",  language: "ar", currency: "JOD", base_path: "/jo_ar/" },
  bhr_en: { website: "bahrain", language: "en", currency: "BHD", base_path: "/bhr_en/" },
  bhr_ar: { website: "bahrain", language: "ar", currency: "BHD", base_path: "/bhr_ar/" },
};

const STORE_CODES = Object.keys(STORE_MAP).sort((a, b) => b.length - a.length);

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function storeCodeFromPath(pathname) {
  const first = (pathname || "/").split("/").filter(Boolean)[0] || "";
  return STORE_MAP[first] ? first : null;
}

function storeCodeFromBaseUrl() {
  if (typeof window === "undefined" || !window.BASE_URL) return null;
  try {
    return storeCodeFromPath(new URL(window.BASE_URL, window.location.origin).pathname);
  } catch {
    return null;
  }
}

function pageSku() {
  const body = document.body;
  if (!body || !/\bcatalog-product-view\b/.test(body.className)) return null;
  const el = document.querySelector("[data-product-sku]");
  return el ? el.getAttribute("data-product-sku") : null;
}

function customerLoggedIn() {
  try {
    const cache = JSON.parse(localStorage.getItem("mage-cache-storage") || "{}");
    const customer = cache.customer || {};
    if (customer.firstname || customer.fullname || customer.email) return true;
  } catch {
    /* ignore */
  }
  return Boolean(readCookie("mage-cache-sessid")) && document.body?.classList.contains("customer-logged-in");
}

export function resolveMidasSession() {
  const store_code =
    storeCodeFromBaseUrl() ||
    storeCodeFromPath(window.location.pathname) ||
    (STORE_MAP[readCookie("store")] ? readCookie("store") : null);

  if (!store_code) {
    return {
      store_code: null,
      website: null,
      locale: null,
      language: null,
      currency: null,
      base_path: "/",
      page_sku: pageSku(),
      customer_logged_in: customerLoggedIn(),
      channel: "web",
    };
  }

  const meta = STORE_MAP[store_code];
  return {
    store_code,
    website: meta.website,
    locale: meta.language,
    language: meta.language,
    currency: meta.currency,
    base_path: meta.base_path,
    page_sku: pageSku(),
    customer_logged_in: customerLoggedIn(),
    channel: "web",
  };
}

export { STORE_MAP, STORE_CODES, readCookie };
