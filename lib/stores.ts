export const STORE_CODES = [
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
] as const;

export type StoreCode = (typeof STORE_CODES)[number];

export type WebsiteId = "kuwait" | "qatar" | "ksa" | "jordan" | "bahrain";

export type SessionContext = {
  store_code: StoreCode;
  website: WebsiteId;
  locale: "en" | "ar";
  language: "en" | "ar";
  currency: "KWD" | "QAR" | "SAR" | "JOD" | "BHD";
  base_path: string;
  page_sku: string | null;
  customer_logged_in: boolean;
  channel: "web";
  chat_session_id: string | null;
};

export const STORE_MAP: Record<
  StoreCode,
  Omit<SessionContext, "store_code" | "page_sku" | "customer_logged_in" | "channel" | "chat_session_id">
> = {
  en: { website: "kuwait", locale: "en", language: "en", currency: "KWD", base_path: "/en/" },
  ar: { website: "kuwait", locale: "ar", language: "ar", currency: "KWD", base_path: "/ar/" },
  qtr_en: { website: "qatar", locale: "en", language: "en", currency: "QAR", base_path: "/qtr_en/" },
  qtr_ar: { website: "qatar", locale: "ar", language: "ar", currency: "QAR", base_path: "/qtr_ar/" },
  ksa_en: { website: "ksa", locale: "en", language: "en", currency: "SAR", base_path: "/ksa_en/" },
  ksa_ar: { website: "ksa", locale: "ar", language: "ar", currency: "SAR", base_path: "/ksa_ar/" },
  jo_en: { website: "jordan", locale: "en", language: "en", currency: "JOD", base_path: "/jo_en/" },
  jo_ar: { website: "jordan", locale: "ar", language: "ar", currency: "JOD", base_path: "/jo_ar/" },
  bhr_en: { website: "bahrain", locale: "en", language: "en", currency: "BHD", base_path: "/bhr_en/" },
  bhr_ar: { website: "bahrain", locale: "ar", language: "ar", currency: "BHD", base_path: "/bhr_ar/" },
};

export const STORE_LABELS: Record<StoreCode, string> = {
  en: "Kuwait · English",
  ar: "الكويت · العربية",
  qtr_en: "Qatar · English",
  qtr_ar: "قطر · العربية",
  ksa_en: "KSA · English",
  ksa_ar: "السعودية · العربية",
  jo_en: "Jordan · English",
  jo_ar: "الأردن · العربية",
  bhr_en: "Bahrain · English",
  bhr_ar: "البحرين · العربية",
};

export const CURRENCY_AR: Record<SessionContext["currency"], string> = {
  KWD: "د.ك",
  QAR: "ر.ق",
  SAR: "ر.س",
  JOD: "د.أ",
  BHD: "د.ب",
};

export const WEBSITE_NAME: Record<WebsiteId, { en: string; ar: string }> = {
  kuwait: { en: "Kuwait", ar: "الكويت" },
  qatar: { en: "Qatar", ar: "قطر" },
  ksa: { en: "Saudi Arabia", ar: "السعودية" },
  jordan: { en: "Jordan", ar: "الأردن" },
  bahrain: { en: "Bahrain", ar: "البحرين" },
};

export function isStoreCode(value: string | null | undefined): value is StoreCode {
  return Boolean(value && (STORE_CODES as readonly string[]).includes(value));
}

export function sessionFromStoreCode(
  store_code: StoreCode,
  extras?: Partial<Pick<SessionContext, "page_sku" | "customer_logged_in" | "chat_session_id">>,
): SessionContext {
  return {
    store_code,
    ...STORE_MAP[store_code],
    page_sku: extras?.page_sku ?? null,
    customer_logged_in: extras?.customer_logged_in ?? false,
    channel: "web",
    chat_session_id: extras?.chat_session_id ?? null,
  };
}

export function pdpUrl(store: SessionContext, urlKey: string) {
  const path = store.base_path.endsWith("/") ? store.base_path : `${store.base_path}/`;
  return `https://midasfurniture.com${path}${urlKey}.html`;
}
