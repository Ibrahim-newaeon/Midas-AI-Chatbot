import type { AssistantTurn, ProductDto } from "./types";

type StoreCode = "en" | "ar" | "qtr_en" | "qtr_ar" | "ksa_en" | "ksa_ar" | "jo_en" | "jo_ar" | "bhr_en" | "bhr_ar";

export type ProductTruth = {
  sku: string;
  storeCode: StoreCode;
  regularPrice: number;
  finalPrice: number;
  currency: ProductDto["currency"];
  stockStatus: ProductDto["stock_status"];
  fetchedAt: string;
};

export type Verdict = { ok: true } | { ok: false; reason: string };

const STORE_CURRENCY: Record<StoreCode, ProductDto["currency"]> = {
  en: "KWD",
  ar: "KWD",
  qtr_en: "QAR",
  qtr_ar: "QAR",
  ksa_en: "SAR",
  ksa_ar: "SAR",
  jo_en: "JOD",
  jo_ar: "JOD",
  bhr_en: "BHD",
  bhr_ar: "BHD",
};

const CURRENCY_TOKEN =
  /(\d[\d,]*(?:\.\d{1,3})?)\s*(KWD|QAR|SAR|JOD|BHD|د\.ك|ر\.ق|ر\.س|د\.أ|د\.ب)/g;

function symbolMatchesCurrency(symbol: string, cur: string): boolean {
  const map: Record<string, string> = {
    "د.ك": "KWD",
    "ر.ق": "QAR",
    "ر.س": "SAR",
    "د.أ": "JOD",
    "د.ب": "BHD",
  };
  return (map[symbol] ?? symbol) === cur;
}

export function toTruth(product: ProductDto, storeCode: StoreCode): ProductTruth {
  return {
    sku: product.sku,
    storeCode,
    regularPrice: product.regular_price,
    finalPrice: product.final_price,
    currency: product.currency,
    stockStatus: product.stock_status,
    fetchedAt: product.fetched_at ?? new Date().toISOString(),
  };
}

export function verifySendGate(
  draft: Pick<AssistantTurn, "message" | "ui">,
  facts: ProductTruth[],
  storeCode: StoreCode,
  ttlMs = Number(process.env.TRUTH_TTL_MS ?? 60_000),
): Verdict {
  if (!(storeCode in STORE_CURRENCY)) {
    return { ok: false, reason: "invalid_store" };
  }
  const scoped = facts.filter((f) => f.storeCode === storeCode);
  const bySku = new Map(scoped.map((f) => [f.sku, f]));
  const expectedCurrency = STORE_CURRENCY[storeCode];

  for (const p of draft.ui.products ?? []) {
    const f = bySku.get(p.sku);
    if (!f) return { ok: false, reason: `ungrounded_sku:${p.sku}` };
    if (p.currency !== f.currency) return { ok: false, reason: `currency_mismatch:${p.sku}` };
    if (p.final_price !== f.finalPrice) return { ok: false, reason: `price_mismatch:${p.sku}` };
    if (f.stockStatus !== "IN_STOCK" && (p.ctas ?? []).includes("add_to_cart")) {
      return { ok: false, reason: `oos_shown:${p.sku}` };
    }
  }

  const allowed = new Set(scoped.flatMap((f) => [f.finalPrice, f.regularPrice]));
  for (const m of draft.message.matchAll(CURRENCY_TOKEN)) {
    const value = Number(m[1].replace(/,/g, ""));
    if (!allowed.has(value)) return { ok: false, reason: `ungrounded_price:${m[0]}` };
    if (!symbolMatchesCurrency(m[2], expectedCurrency)) {
      return { ok: false, reason: `wrong_currency_in_prose:${m[0]}` };
    }
  }

  const now = Date.now();
  if (scoped.some((f) => now - Date.parse(f.fetchedAt) > ttlMs)) {
    return { ok: false, reason: "stale_facts" };
  }

  return { ok: true };
}

export function safeRefusal(lang: "en" | "ar"): Pick<AssistantTurn, "message" | "ui"> {
  return {
    message:
      lang === "ar"
        ? "تعذر تأكيد السعر أو القطعة من الكتالوج الحي لهذه الجولة. يمكن لخدمة العملاء المتابعة."
        : "I could not confirm that price or piece from this store’s live catalog this turn. Customer care can take it from here.",
    ui: { products: [], ctas: ["handoff"], handoff: { show: true, reason: "unresolved" } },
  };
}
