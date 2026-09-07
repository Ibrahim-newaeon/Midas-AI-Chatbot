type Currency = "KWD" | "QAR" | "SAR" | "JOD" | "BHD";
type Lang = "en" | "ar";

type Piece = {
  sku: string;
  name: string;
  categories: string[];
  currency: Currency;
  regular_price: number;
  final_price: number;
  discount_percent: number | null;
  stock_status: "IN_STOCK" | "OUT_OF_STOCK";
};

const CURRENCY_AR: Record<Currency, string> = {
  KWD: "د.ك",
  QAR: "ر.ق",
  SAR: "ر.س",
  JOD: "د.أ",
  BHD: "د.ب",
};

const CATEGORY_RULES: Array<{ test: RegExp; en: string; ar: string }> = [
  { test: /bedroom set|king size bedroom|queen size bedroom|طقم غرفة نوم/i, en: "Bedroom Set", ar: "طقم غرفة نوم" },
  { test: /dining set|طقم سفرة|طقم طعام/i, en: "Dining Set", ar: "طقم سفرة" },
  { test: /tv unit|tv stand|وحدة تلفاز|مكتبة تلفاز/i, en: "TV Unit", ar: "وحدة تلفاز" },
  { test: /coffee table|centre table|center table|طاولة وسط/i, en: "Coffee Table", ar: "طاولة وسط" },
  { test: /dining chair|كرسي سفرة/i, en: "Dining Chair", ar: "كرسي سفرة" },
  { test: /sofa|sectional|كنبة|كنب/i, en: "Sofa", ar: "كنبة" },
  { test: /wardrobe|دولاب/i, en: "Wardrobe", ar: "دولاب" },
  { test: /bedrooms|غرفة نوم/i, en: "Bedroom", ar: "غرفة نوم" },
  { test: /dining|سفرة|طعام/i, en: "Dining", ar: "سفرة" },
  { test: /living|معيشة/i, en: "Living", ar: "معيشة" },
  { test: /chair|كرسي/i, en: "Chair", ar: "كرسي" },
];

export function categoryLabel(product: Pick<Piece, "name" | "categories">, lang: Lang): string {
  const hay = `${product.name} ${(product.categories ?? []).join(" ")}`;
  const hit = CATEGORY_RULES.find((rule) => rule.test.test(hay));
  return hit ? hit[lang] : lang === "ar" ? "قطعة" : "Furniture";
}

export function collectionName(name: string): string {
  const latin = name.match(/\b[A-Z]{3,}[A-Z0-9-]*\b/);
  if (latin) return latin[0];
  return name.trim().split(/\s+/)[0] || name;
}

export function pieceHeadline(product: Pick<Piece, "name" | "categories">, lang: Lang): string {
  const collection = collectionName(product.name);
  const category = categoryLabel(product, lang);
  return lang === "ar" ? `${category} ${collection}` : `${collection} ${category}`;
}

function amount(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function identityPrice(product: Piece, lang: Lang): string {
  const cur = lang === "ar" ? CURRENCY_AR[product.currency] : product.currency;
  const now = `${amount(product.final_price)} ${cur}`;
  if (product.regular_price > product.final_price) {
    return `${now} (was ${amount(product.regular_price)})`;
  }
  return now;
}

export function fomoLine(product: Piece, country: string, lang: Lang): string | null {
  if (product.stock_status !== "IN_STOCK") return null;
  const off =
    product.discount_percent && product.discount_percent > 0
      ? product.discount_percent
      : product.regular_price > product.final_price
        ? Math.round((1 - product.final_price / product.regular_price) * 100)
        : 0;
  if (off > 0) {
    return lang === "ar"
      ? `هذا السعر الخاص حي الآن في ${country} — خصم ${off}%. أضفه قبل أن يتغيّر سعر الكتالوج.`
      : `This special price is live in ${country} now — ${off}% off. Add it before this catalog price changes.`;
  }
  return lang === "ar"
    ? `متوفر الآن في ${country}. القطع الجاهزة تُحجز حسب المخزون الحي.`
    : `In stock in ${country} now. Ready-made pieces follow live catalog stock.`;
}

export function identityReply(input: {
  product: Piece;
  country: string;
  lang: Lang;
  prefix?: string;
}): string {
  const { product, country, lang, prefix = "" } = input;
  const headline = pieceHeadline(product, lang);
  const price = identityPrice(product, lang);
  const stock =
    product.stock_status === "IN_STOCK"
      ? lang === "ar"
        ? "متوفر"
        : "in stock"
      : lang === "ar"
        ? "غير متوفر"
        : "not in stock";
  const facts =
    lang === "ar"
      ? `${headline}، رقم ${product.sku}، ${price}، ${stock} في ${country}.`
      : `${headline}, SKU ${product.sku}, ${price}, ${stock} in ${country}.`;
  const lines = [prefix + facts];
  const fomo = fomoLine(product, country, lang);
  if (fomo) lines.push(fomo);
  if (product.stock_status === "IN_STOCK") {
    lines.push(lang === "ar" ? "نضيفه إلى السلة؟" : "Add to cart?");
  }
  return lines.join("\n");
}
