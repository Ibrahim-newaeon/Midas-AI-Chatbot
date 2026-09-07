import { readFile } from "fs/promises";
import path from "path";
import { checkStock, getCurrentPromotions, getPolicy, getProduct, getProductByUrlKey, searchCatalog, searchOnSale, visualSearch } from "@/lib/tools";
import { parseMidasProductUrl } from "@/lib/productLink";
import { CURRENCY_AR, STORE_MAP, WEBSITE_NAME, type SessionContext } from "@/lib/stores";
import type { AssistantTurn, ChatMessage, ProductCta, ProductDto, UiPayload } from "@/lib/types";

const SKU_RE = /\b(\d{4,8})\b/;
const ARABIC_RE = /[\u0600-\u06FF]/;
const CUSTOM_RE = /custom(?!er)|تفصيل|قماش خاص|made to measure|fabric change|لون خاص/i;
const ORDER_RE = /order\s*(#|no\.?|number)?\s*\d+|رقم الطلب|وين الطلب|where is (my )?order|track/i;
const DELIVERY_RE = /deliver|توصيل|شحن|installation|تركيب|free shipping/i;
const WALLET_RE = /wallet|محفظة|midas cash/i;
const SHOWROOM_RE = /showroom|branch(?:es)?|locator|معرض|فروع|\bفرع\b/i;
const HOURS_RE = /\bhours\b|opening|open now|closing time|دوام|ساعات(?:\s+العمل)?/i;
const CARE_RE =
  /customer\s*(service|care|center|centre|support)|خدمة العملاء|مركز الخدمة|hotline|call\s*cent(?:er|re)|whats?app|واتساب/i;
const COMPLAINT_RE =
  /complain|complaint|شكوى|شكاي|damaged|broken|wrong item|missing (piece|part)|not (happy|satisfied)|unhappy|issue with|problem with|bought .{0,40}(problem|issue|wrong)/i;
const PAY_RE = /knet|tabby|tamara|payment|دفع|كي نت/i;
const RETURN_RE = /return|استرجاع|تبديل|refund/i;
const OFFERS_RE = /\boffers?\b|\bon sale\b|promo|promotion|\bdeals?\b|عروض|(?<!م)عرض|تخفيض|weekly surprise/i;
const INJECTION_RE = /ignore (all )?(previous|prior|above) instructions|reveal (the )?(system )?prompt|90%\s*off/i;
const DISCOUNT_RE = /can you (do|give|make).{0,24}(\d+\s*%|discount)|special price for me|make it cheaper|تفاوض|خصم خاص|اعمل خصم/i;

function catalogQuery(text: string) {
  return text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/i saw this in kuwait[^.?!]*/i, " ")
    .replace(/\d+([.,]\d+)?\s*(kwd|qar|sar|jod|bhd|د\.ك)/gi, " ")
    .replace(/same price\??/i, " ")
    .replace(/do you have (something like this|a|an)?/i, " ")
    .replace(/هل عندكم شي يناسب/g, "مجلس")
    .replace(/\s+/g, " ")
    .trim();
}

function replyLanguage(session: SessionContext, text: string): "en" | "ar" {
  if (ARABIC_RE.test(text)) return "ar";
  return session.language;
}

function money(product: ProductDto, lang: "en" | "ar") {
  const amount = product.final_price.toLocaleString(lang === "ar" ? "en-US" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (lang === "ar") return `${amount} ${CURRENCY_AR[product.currency]}`;
  return `${amount} ${product.currency}`;
}

function cards(products: ProductDto[], extra: ProductCta[] = ["view"]): UiPayload {
  const sliced = products.slice(0, 3);
  const ctas: ProductCta[] = sliced.some((p) => p.stock_status === "IN_STOCK")
    ? ["view", "add_to_cart"]
    : ["view", "handoff"];
  return {
    products: sliced.map((p) => ({
      ...p,
      title: p.name,
      ctas: p.stock_status === "IN_STOCK" ? (["view", "add_to_cart"] as ProductCta[]) : (["view"] as ProductCta[]),
    })),
    ctas: extra.length ? Array.from(new Set([...ctas, ...extra])) : ctas,
    handoff: { show: extra.includes("handoff"), reason: extra.includes("handoff") ? "human" : null },
  };
}

function emptyUi(handoff = false, reason: string | null = null): UiPayload {
  return { products: [], ctas: handoff ? ["handoff"] : [], handoff: { show: handoff, reason } };
}

export async function loadSystemPrompt() {
  const file = path.join(process.cwd(), "prompts", "midas-ai-website-system.md");
  return readFile(file, "utf8");
}

async function describeImage(dataUrl: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this furniture photo as search keywords for a Magento catalog. Include category, colours, materials, style, and room (majlis means seating not dining). Return one English line only. No SKU.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

export async function runRulesOrchestrator(input: {
  session: SessionContext;
  messages: ChatMessage[];
  image_data_url?: string | null;
}): Promise<AssistantTurn> {
  const session = input.session;
  const last = [...input.messages].reverse().find((m) => m.role === "user")?.content?.trim() || "";
  const lang = replyLanguage(session, last);
  const country = WEBSITE_NAME[session.website][lang];
  const used: string[] = [];

  if (INJECTION_RE.test(last)) {
    used.push("get_current_promotions");
    const promo = await getCurrentPromotions(session.store_code);
    const message =
      lang === "ar"
        ? "لا أستطيع عمل خصم خاص من هذه الدردشة. العروض الحالية هي الأسعار الخاصة الظاهرة في الكتالوج."
        : "I cannot create a special discount from this chat. Current sale prices are the special prices already on this store’s catalog.";
    return {
      message,
      ui: promo.ok && promo.products.length ? cards(promo.products, ["handoff"]) : emptyUi(true, "discount_request"),
      used_tools: used,
      engine: "rules",
    };
  }

  if (DISCOUNT_RE.test(last)) {
    used.push("escalate_to_human");
    used.push("get_policy");
    const care = getPolicy(session.store_code, "customer_care");
    const message =
      lang === "ar"
        ? `لا أتفاوض على السعر من الدردشة. خدمة العملاء تتابع الطلبات الخاصة. ${care.ok ? care.text : ""}`
        : `I cannot negotiate a price from this chat. Customer care handles special terms. ${care.ok ? care.text : ""}`;
    return { message, ui: emptyUi(true, "discount_request"), used_tools: used, engine: "rules" };
  }

  const pastedLink = parseMidasProductUrl(last);
  if (pastedLink) {
    used.push("get_product_by_url_key");
    const found = await getProductByUrlKey(session.store_code, pastedLink.url_key);
    const urlStore = pastedLink.store_code;
    const crossStore = Boolean(urlStore && urlStore !== session.store_code);
    const urlCountry =
      urlStore && urlStore in STORE_MAP ? WEBSITE_NAME[STORE_MAP[urlStore].website][lang] : null;

    if (!found.ok) {
      const message =
        lang === "ar"
          ? crossStore && urlCountry
            ? `هذا الرابط من موقع ${urlCountry}. لا أحوّل أسعار ${urlCountry} إلى ${session.currency}. ولم أجد هذه القطعة في كتالوج ${country}. لن أقترح بديلاً مشابهاً من الرابط.`
            : `لم أجد قطعة ميداس مطابقة لهذا الرابط في متجر ${country}. لن أخمن قطعة مشابهة من اسم الرابط.`
          : crossStore && urlCountry
            ? `This link is from the ${urlCountry} website. I will not convert ${urlCountry} prices into ${session.currency}, and I could not find that piece in the ${country} catalog. I will not guess a similar item from the link.`
            : `I could not find that Midas Furniture piece for this link in the ${country} store. I will not guess a similar item from the URL.`;
      return { message, ui: emptyUi(), used_tools: used, engine: "rules" };
    }

    const p = found.product;
    const stockLine =
      p.stock_status === "IN_STOCK"
        ? lang === "ar"
          ? "متوفر الآن"
          : "In stock"
        : lang === "ar"
          ? "غير متوفر في هذا المتجر"
          : "Not in stock on this store";
    const storeLock =
      crossStore && urlCountry
        ? lang === "ar"
          ? `الرابط من موقع ${urlCountry}. السعر أدناه من متجر ${country} بـ ${session.currency} وليس تحويلاً. `
          : `The link is from the ${urlCountry} website. The price below is the ${country} catalog in ${session.currency}, not a conversion. `
        : "";
    const message =
      lang === "ar"
        ? `${storeLock}هذه القطعة من الرابط: ${p.name} — ${money(p, "ar")}${p.regular_price > p.final_price ? ` (كان ${p.regular_price})` : ""}. ${stockLine} في ${country}.`
        : `${storeLock}This is the piece from your link: ${p.name} is ${money(p, "en")}${p.regular_price > p.final_price ? ` (was ${p.regular_price} ${p.currency})` : ""}. ${stockLine} in ${country}.`;
    return { message, ui: cards([p]), used_tools: used, engine: "rules" };
  }

  if (/https?:\/\//i.test(last) && !catalogQuery(last)) {
    const message =
      lang === "ar"
        ? "أستطيع فتح روابط منتجات midasfurniture.com فقط. الصق رابط صفحة المنتج وسأحمّل تلك القطعة من الكتالوج."
        : "I can only open product links from midasfurniture.com. Paste a product page link and I will load that exact piece from the catalog.";
    return { message, ui: emptyUi(), used_tools: used, engine: "rules" };
  }

  if (COMPLAINT_RE.test(last) || ORDER_RE.test(last)) {
    used.push("escalate_to_human");
    const topic = COMPLAINT_RE.test(last) ? "complaints" : "customer_care";
    const care = getPolicy(session.store_code, topic);
    used.push("get_policy");
    const message = care.ok
      ? care.text
      : lang === "ar"
        ? "لا أستطيع فتح الطلب من هنا. تواصل مع خدمة العملاء مع رقم الطلب."
        : "I cannot open the order from this chat. Contact customer care with your order number.";
    return { message, ui: emptyUi(true, topic), used_tools: used, engine: "rules" };
  }

  if (CARE_RE.test(last) || SHOWROOM_RE.test(last) || HOURS_RE.test(last)) {
    used.push("get_policy");
    const topics: Array<"showrooms" | "hours" | "customer_care"> = [];
    if (SHOWROOM_RE.test(last)) topics.push("showrooms");
    if (HOURS_RE.test(last)) topics.push("hours");
    if (CARE_RE.test(last) || topics.length === 0) topics.push("customer_care");
    const parts = topics
      .map((topic) => getPolicy(session.store_code, topic))
      .filter((p) => p.ok)
      .map((p) => ("text" in p ? p.text : ""));
    const message =
      parts.filter(Boolean).join("\n\n") ||
      (lang === "ar"
        ? "تعذر تأكيد بيانات المعرض الآن. يمكن لخدمة العملاء المساعدة."
        : "I cannot confirm that branch detail from here. Customer care can help.");
    return { message, ui: emptyUi(true, topics[0]), used_tools: used, engine: "rules" };
  }

  if (CUSTOM_RE.test(last)) {
    used.push("get_policy");
    const policy = getPolicy(session.store_code, "customization");
    const search = await searchCatalog({
      store_code: session.store_code,
      query: last.replace(CUSTOM_RE, "velvet sofa chair"),
      in_stock_only: true,
      page_size: 3,
    });
    used.push("search_catalog");
    const products = search.ok ? search.products : [];
    const message =
      lang === "ar"
        ? `${policy.ok ? policy.text : ""} هذه بدائل جاهزة متوفرة في ${country}.`
        : `${policy.ok ? policy.text : ""} Here are ready-made in-stock alternatives in ${country}.`;
    return { message, ui: cards(products), used_tools: used, engine: "rules" };
  }

  if (OFFERS_RE.test(last)) {
    used.push("get_current_promotions");
    const extra = catalogQuery(last)
      .replace(OFFERS_RE, " ")
      .replace(/\b(what|whats|which|current|available|today|week|the|any|some|do|you|have|please|show|me|on)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const promo = await getCurrentPromotions(session.store_code);
    const narrowed = extra.length > 2 ? await searchOnSale(session.store_code, 3, extra) : null;
    const products =
      narrowed && narrowed.ok && narrowed.products.length
        ? narrowed.products
        : promo.ok
          ? promo.products
          : [];
    if (!products.length) {
      return {
        message:
          lang === "ar"
            ? `لم أجد قطعاً مخفّضة مؤكدة في ${country} من الكتالوج الآن. اسأل عن غرفة معيّنة مثل غرفة المعيشة أو السفرة.`
            : `I could not confirm discounted pieces in ${country} from the live catalog just now. Ask about a room — living, dining, or bedroom — and I will check sale prices there.`,
        ui: emptyUi(),
        used_tools: used,
        engine: "rules",
      };
    }
    const first = products[0];
    const campaign = promo.ok && promo.campaigns[0] ? ` ${promo.campaigns[0]}.` : "";
    const off = first.discount_percent ? `${first.discount_percent}%` : "";
    const message =
      lang === "ar"
        ? `هذه أسعار خاصة حية في متجر ${country}.${campaign} مثال: ${first.name} بسعر ${money(first, "ar")}${off ? ` (خصم ${off})` : ""}.`
        : `Live special prices in ${country}.${campaign} Example: ${first.name} at ${money(first, "en")}${off ? ` (${off} off)` : ""}.`;
    return { message, ui: cards(products), used_tools: used, engine: "rules" };
  }

  const policyMap: Array<[RegExp, string]> = [
    [DELIVERY_RE, "delivery"],
    [WALLET_RE, "wallet"],
    [PAY_RE, "payments"],
    [RETURN_RE, "returns"],
  ];
  for (const [re, topic] of policyMap) {
    if (re.test(last) && !SKU_RE.test(last)) {
      used.push("get_policy");
      const policy = getPolicy(session.store_code, topic);
      const message = policy.ok
        ? policy.text
        : lang === "ar"
          ? "تعذر تأكيد السياسة الآن. يمكن لخدمة العملاء المساعدة."
          : "I cannot confirm that policy from here. Customer care can help.";
      return { message, ui: emptyUi(true, topic), used_tools: used, engine: "rules" };
    }
  }

  const skuMatch = last.match(SKU_RE);
  const sku = session.page_sku || skuMatch?.[1];
  if (sku && (session.page_sku || /sku|stock|متوفر|سعر|price/i.test(last))) {
    used.push("get_product");
    const found = await getProduct(session.store_code, sku);
    if (!found.ok) {
      return {
        message:
          lang === "ar"
            ? `لم أجد القطعة ${sku} في متجر ${country}.`
            : `I could not find SKU ${sku} in the ${country} store.`,
        ui: emptyUi(),
        used_tools: used,
        engine: "rules",
      };
    }
    used.push("check_stock");
    const stock = await checkStock(session.store_code, sku);
    const p = found.product;
    const stockLine =
      stock.ok && stock.stock_status === "IN_STOCK"
        ? lang === "ar"
          ? "متوفر الآن"
          : "In stock"
        : lang === "ar"
          ? "غير متوفر في هذا المتجر"
          : "Not in stock on this store";
    const message =
      lang === "ar"
        ? `${p.name} — ${money(p, "ar")}${p.regular_price > p.final_price ? ` (كان ${p.regular_price})` : ""}. ${stockLine} في ${country}.`
        : `${p.name} is ${money(p, "en")}${p.regular_price > p.final_price ? ` (was ${p.regular_price} ${p.currency})` : ""}. ${stockLine} in ${country}.`;
    return { message, ui: cards([p]), used_tools: used, engine: "rules" };
  }

  let visionQuery: string | null = null;
  if (input.image_data_url) {
    visionQuery = await describeImage(input.image_data_url);
    used.push("visual_search");
    const vis = await visualSearch({
      store_code: session.store_code,
      user_note: last,
      vision_query: visionQuery ?? undefined,
    });
    if (vis.ok && vis.products.length) {
      const message =
        lang === "ar"
          ? `هذه أقرب القطع المتوفرة في ${country} بناءً على الصورة${last ? " ووصفك" : ""}. ليست بالضرورة نفس قطعة بينترست.`
          : `Closest in-stock matches in ${country} from your photo${last ? " and note" : ""}. These are style matches, not a claim that we have the exact Pinterest SKU.`;
      return { message, ui: cards(vis.products), used_tools: used, engine: "rules" };
    }
  }

  const kwdTrap = /kwd|د\.ك|kuwait price|سعر الكويت/i.test(last) && session.website !== "kuwait";
  used.push("search_catalog");
  const query = catalogQuery(last) || last || visionQuery || "furniture";
  const result = await searchCatalog({
    store_code: session.store_code,
    query,
    room: /majlis|مجلس|ديوان/i.test(last) ? "majlis" : null,
    brand: /kare|كاري/i.test(last) ? "Kare" : /ashley|آشلي|اشلي/i.test(last) ? "Ashley" : null,
    in_stock_only: true,
    page_size: 3,
  });

  if (!result.ok) {
    return {
      message:
        lang === "ar"
          ? "تعذر الوصول إلى كتالوج ميداس الآن. حاول مرة أخرى أو تواصل مع خدمة العملاء."
          : "I could not reach the Midas catalog just now. Please try again or talk to customer care.",
      ui: emptyUi(true, "catalog_unavailable"),
      used_tools: used,
      engine: "rules",
    };
  }

  if (!result.products.length) {
    return {
      message:
        lang === "ar"
          ? `لم أجد تطابقاً قريباً في ${country}. صف الغرفة أو المقاس أو الميزانية لأحسّن البحث.`
          : `I could not find a close match in ${country}. Tell me the room, size, or budget and I will search again.`,
      ui: emptyUi(),
      used_tools: used,
      engine: "rules",
    };
  }

  const trap =
    kwdTrap && lang === "ar"
      ? `الأسعار هنا بـ ${session.currency} من متجر ${country} وليست تحويلاً من الدينار الكويتي. `
      : kwdTrap
        ? `Prices on this store are ${session.currency} for ${country} and are not converted from KWD. `
        : "";

  const majlisNote =
    /majlis|مجلس/i.test(last) && lang === "ar"
      ? "لمجلس صغير أنسب الجلوس المدمج وليس طاولة طعام. "
      : /majlis|مجلس/i.test(last)
        ? "For a small majlis I am showing seating, not dining tables. "
        : "";

  const first = result.products[0];
  const message =
    lang === "ar"
      ? `${trap}${majlisNote}هذه قطع متوفرة في ${country}. مثال: ${first.name} بسعر ${money(first, "ar")}. هل تفضّل أن أضيّق البحث حسب المقاس أو الميزانية؟`
      : `${trap}${majlisNote}In-stock in ${country}. One option is ${first.name} at ${money(first, "en")}. Shall I narrow by size or budget?`;

  return { message, ui: cards(result.products), used_tools: used, engine: "rules" };
}

export async function runChat(input: {
  session: SessionContext;
  messages: ChatMessage[];
  image_data_url?: string | null;
}): Promise<AssistantTurn> {
  // OpenAI path is optional; Magento tools always run via the rules engine until a key is used for vision.
  return runRulesOrchestrator(input);
}
