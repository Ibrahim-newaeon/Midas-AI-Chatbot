import type { ChatMessage, SearchCatalogInput } from "./types";

export type QueryConstraints = {
  query: string;
  max_price: number | null;
  color: string | null;
  material: string | null;
  room: "majlis" | "living" | "dining" | "bedroom" | null;
  brand: string | null;
  sku: string | null;
  followUp: boolean;
  addToCart: boolean;
};

const SKU_ONLY = /^\s*(\d{4,8})\s*$/;
const SKU_ANY = /\b(\d{4,8})\b/;
const ADD_RE = /\badd (it|this|them|to cart)\b|أضف|ضيفي|حطها|ضعها في السلة|add to cart/i;
const BUDGET_RE =
  /(?:under|below|less than|max(?:imum)?|up to|budget|أقل من|تحت|بحد أقصى|مو أكثر من|ميزانية)\s*(\d{2,6})/i;
const BUDGET_AFTER_RE = /(\d{2,6})\s*(?:kwd|qar|sar|jod|bhd|د\.ك|ر\.ق|ر\.س)?\s*(?:or less|and under|max|وأقل|أو أقل)/i;

const COLORS: Array<[RegExp, string]> = [
  [/\bblack\b|أسود|اسود/i, "black"],
  [/\bwhite\b|أبيض|ابيض/i, "white"],
  [/\bgrey\b|\bgray\b|رمادي/i, "grey"],
  [/\bbeige\b|بيج/i, "beige"],
  [/\bbrown\b|بني/i, "brown"],
  [/\bgold\b|ذهبي/i, "gold"],
  [/\bblue\b|أزرق|ازرق/i, "blue"],
  [/\bgreen\b|أخضر|اخضر/i, "green"],
];

const MATERIALS: Array<[RegExp, string]> = [
  [/velvet|مخمل/i, "velvet"],
  [/leather|جلد/i, "leather"],
  [/oak|بلوط/i, "oak"],
  [/walnut|جوز/i, "walnut"],
  [/marble|رخام/i, "marble"],
  [/fabric|قماش/i, "fabric"],
];

function lastUserTexts(messages: ChatMessage[]) {
  return messages.filter((m) => m.role === "user").map((m) => m.content.trim()).filter(Boolean);
}

export function redactPii(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "[phone]");
}

export function parseBudget(text: string): number | null {
  const a = text.match(BUDGET_RE);
  if (a) return Number(a[1]);
  const b = text.match(BUDGET_AFTER_RE);
  if (b) return Number(b[1]);
  return null;
}

export function lastSpokenSku(messages: ChatMessage[]): string | null {
  for (const m of [...messages].reverse()) {
    const hit = m.content.match(/SKU\s+(\d{4,8})/i) || m.content.match(/رقم\s+(\d{4,8})/i);
    if (hit) return hit[1];
  }
  return null;
}

export function extractConstraints(messages: ChatMessage[]): QueryConstraints {
  const users = lastUserTexts(messages);
  const last = users.at(-1) ?? "";
  const prior = users.slice(0, -1).join(" ");
  const addToCart = ADD_RE.test(last);
  const skuOnly = last.match(SKU_ONLY)?.[1] ?? null;
  const shortFollowUp = last.length > 0 && last.length < 48 && users.length > 1;
  const followUp = shortFollowUp && !skuOnly && !/https?:\/\//i.test(last);
  const blended = followUp ? `${prior} ${last}` : last;
  const hay = redactPii(blended);

  let color: string | null = null;
  for (const [re, value] of COLORS) {
    if (re.test(hay)) {
      color = value;
      break;
    }
  }
  let material: string | null = null;
  for (const [re, value] of MATERIALS) {
    if (re.test(hay)) {
      material = value;
      break;
    }
  }

  const room = /majlis|majles|diwaniya|dawaniya|مجلس|ديوان/i.test(hay)
    ? "majlis"
    : /dining|سفرة|طعام/i.test(hay)
      ? "dining"
      : /bedroom|نوم|سرير/i.test(hay)
        ? "bedroom"
        : /living|معيشة|صالة/i.test(hay)
          ? "living"
          : null;

  const brand = /kare|كاري/i.test(hay) ? "Kare" : /ashley|آشلي|اشلي/i.test(hay) ? "Ashley" : null;
  const max_price = parseBudget(hay);
  const sku =
    skuOnly ??
    (addToCart ? lastSpokenSku(messages) : null) ??
    (/sku|stock|متوفر|سعر|price/i.test(last) ? (last.match(SKU_ANY)?.[1] ?? null) : null);

  const query = hay
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/i saw this in kuwait[^.?!]*/i, " ")
    .replace(BUDGET_RE, " ")
    .replace(BUDGET_AFTER_RE, " ")
    .replace(/same price\??/i, " ")
    .replace(/do you have (something like this|a|an)?/i, " ")
    .replace(/هل عندكم شي يناسب/g, "مجلس")
    .replace(/\s+/g, " ")
    .trim();

  return {
    query,
    max_price,
    color,
    material,
    room,
    brand,
    sku,
    followUp,
    addToCart,
  };
}

export function toSearchInput(store_code: SearchCatalogInput["store_code"], c: QueryConstraints): SearchCatalogInput {
  return {
    store_code,
    query: c.query || "furniture",
    brand: c.brand,
    color: c.color,
    material: c.material,
    room: c.room,
    max_price: c.max_price,
    in_stock_only: true,
    page_size: 8,
  };
}
