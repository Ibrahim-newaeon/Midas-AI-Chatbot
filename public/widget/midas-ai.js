/**
 * Magento drop-in for Midas AI.
 *
 *   <script src="https://YOUR_HOST/widget/midas-ai.js" async></script>
 *
 * Optional: data-catalog="mirror" on the script tag for the rehearsal storefront.
 * Session comes from Magento BASE_URL / store cookie / path (see docs/session-injection.md).
 */
(function () {
  if (window.__MIDAS_AI_BOOTED) return;
  window.__MIDAS_AI_BOOTED = true;

  var STORE_MAP = {
    en: { website: "kuwait", language: "en", currency: "KWD", base_path: "/en/" },
    ar: { website: "kuwait", language: "ar", currency: "KWD", base_path: "/ar/" },
    qtr_en: { website: "qatar", language: "en", currency: "QAR", base_path: "/qtr_en/" },
    qtr_ar: { website: "qatar", language: "ar", currency: "QAR", base_path: "/qtr_ar/" },
    ksa_en: { website: "ksa", language: "en", currency: "SAR", base_path: "/ksa_en/" },
    ksa_ar: { website: "ksa", language: "ar", currency: "SAR", base_path: "/ksa_ar/" },
    jo_en: { website: "jordan", language: "en", currency: "JOD", base_path: "/jo_en/" },
    jo_ar: { website: "jordan", language: "ar", currency: "JOD", base_path: "/jo_ar/" },
    bhr_en: { website: "bahrain", language: "en", currency: "BHD", base_path: "/bhr_en/" },
    bhr_ar: { website: "bahrain", language: "ar", currency: "BHD", base_path: "/bhr_ar/" },
  };

  function readCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function storeFromPath(pathname) {
    var first = (pathname || "/").split("/").filter(Boolean)[0] || "";
    return STORE_MAP[first] ? first : null;
  }

  function storeFromBaseUrl() {
    if (!window.BASE_URL) return null;
    try {
      return storeFromPath(new URL(window.BASE_URL, window.location.origin).pathname);
    } catch (e) {
      return null;
    }
  }

  function pageSku() {
    var el = document.querySelector("[data-product-sku]");
    return el ? el.getAttribute("data-product-sku") : "";
  }

  var script = document.currentScript;
  var origin = new URL(script.src).origin;
  var catalogAttr = (script.getAttribute("data-catalog") || "live").toLowerCase();
  var catalog = catalogAttr === "mirror" ? "mirror" : catalogAttr === "import" ? "import" : "live";
  var tenant = script.getAttribute("data-tenant") || "";
  var store =
    script.getAttribute("data-store") ||
    storeFromBaseUrl() ||
    storeFromPath(window.location.pathname) ||
    (STORE_MAP[readCookie("store")] ? readCookie("store") : "en");
  var rtl = (STORE_MAP[store] || {}).language === "ar" || script.getAttribute("data-language") === "ar";

  var iframe = document.createElement("iframe");
  iframe.title = "Midas AI";
  iframe.setAttribute("data-testid", "midas-ai-embed");
  iframe.allow = "clipboard-write";
  iframe.src =
    origin +
    "/embed?store=" +
    encodeURIComponent(store) +
    "&catalog=" +
    encodeURIComponent(catalog) +
    (tenant ? "&tenant=" + encodeURIComponent(tenant) : "") +
    (pageSku() ? "&sku=" + encodeURIComponent(pageSku()) : "");

  function place(open, mobile) {
    iframe.style.cssText = [
      "position:fixed",
      "z-index:2147483000",
      "border:0",
      "background:transparent",
      "color-scheme:normal",
      open && mobile ? "inset:0;width:100%;height:100%;" : "",
      !(open && mobile) ? (rtl ? "left:16px;right:auto;" : "right:16px;left:auto;") : "",
      !(open && mobile) ? "bottom:16px;" : "",
      !open ? "width:200px;height:72px;" : "",
      open && !mobile ? "width:420px;height:min(740px, calc(100dvh - 32px));" : "",
    ]
      .filter(Boolean)
      .join(";");
  }

  place(false, window.matchMedia("(max-width: 767px)").matches);
  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    if (!event.data || event.data.type !== "midas:frame") return;
    place(Boolean(event.data.open), Boolean(event.data.mobile));
  });

  function mount() {
    document.body.appendChild(iframe);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
