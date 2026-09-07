import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expandArabiziLexicon, expandSearchQueries, normalizeArabic } from "./arabicNormalize.ts";
import { fomoLine, identityReply, pieceHeadline } from "./productCopy.ts";
import { parseMidasProductUrl } from "./productLink.ts";
import { extractConstraints, parseBudget, redactPii } from "./queryUnderstanding.ts";
import { withMidasAiUtm } from "./utm.ts";
import { verifySendGate, type ProductTruth } from "./verifier.ts";

const catalogSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "mirrorCatalog.ts"), "utf8");

test("arabic hamza variants collapse", () => {
  assert.equal(normalizeArabic("أريكة"), normalizeArabic("اريكة"));
  assert.equal(normalizeArabic("أريكة"), normalizeArabic("اريكه"));
});

test("arabizi furniture lexicon", () => {
  assert.match(expandArabiziLexicon("bagi kanaba lel majles"), /كنبة/);
  assert.match(expandArabiziLexicon("bagi kanaba lel majles"), /مجلس/);
});

test("search expansion includes seating for majlis", () => {
  const q = expandSearchQueries("ديوانية صغيرة");
  assert.ok(q.some((s) => /sofa|كنبة/i.test(s)));
});

const fact = (over: Partial<ProductTruth> = {}): ProductTruth => ({
  sku: "154534",
  storeCode: "en",
  regularPrice: 995,
  finalPrice: 495,
  currency: "KWD",
  stockStatus: "IN_STOCK",
  fetchedAt: new Date().toISOString(),
  ...over,
});

test("send-gate blocks ungrounded sku", () => {
  const v = verifySendGate(
    {
      message: "Hello",
      ui: {
        products: [
          {
            sku: "NOPE",
            name: "x",
            title: "x",
            brand: null,
            image_url: null,
            url_key: "x",
            pdp_url: "https://midasfurniture.com/en/x.html",
            regular_price: 1,
            final_price: 1,
            currency: "KWD",
            discount_percent: null,
            stock_status: "IN_STOCK",
            categories: [],
            color: null,
            material: null,
            dimensions: null,
            ctas: ["view"],
          },
        ],
        ctas: ["view"],
        handoff: { show: false, reason: null },
      },
    },
    [fact()],
    "en",
  );
  assert.equal(v.ok, false);
});

test("send-gate allows grounded Kuwait price", () => {
  const v = verifySendGate(
    {
      message: "LONDER is 495 KWD (was 995 KWD).",
      ui: {
        products: [
          {
            sku: "154534",
            name: "LONDER",
            title: "LONDER",
            brand: null,
            image_url: null,
            url_key: "londer",
            pdp_url: "https://midasfurniture.com/en/londer.html",
            regular_price: 995,
            final_price: 495,
            currency: "KWD",
            discount_percent: 50,
            stock_status: "IN_STOCK",
            categories: [],
            color: null,
            material: null,
            dimensions: null,
            ctas: ["view"],
          },
        ],
        ctas: ["view"],
        handoff: { show: false, reason: null },
      },
    },
    [fact()],
    "en",
  );
  assert.equal(v.ok, true);
});

test("send-gate blocks KWD on Jordan session", () => {
  const v = verifySendGate(
    {
      message: "This is 84 KWD.",
      ui: { products: [], ctas: [], handoff: { show: false, reason: null } },
    },
    [fact({ storeCode: "jo_en", currency: "JOD", finalPrice: 84, regularPrice: 84, sku: "1" })],
    "jo_en",
  );
  assert.equal(v.ok, false);
});

test("send-gate allows OOS identity without add_to_cart", () => {
  const v = verifySendGate(
    {
      message: "LONDER Bedroom Set, SKU 154534, 189 JOD (was 355), not in stock in Jordan.",
      ui: {
        products: [
          {
            sku: "154534",
            name: "LONDER",
            title: "LONDER Bedroom Set",
            brand: null,
            image_url: null,
            url_key: "londer",
            pdp_url: "/jo_en/londer.html",
            regular_price: 355,
            final_price: 189,
            currency: "JOD",
            discount_percent: 47,
            stock_status: "OUT_OF_STOCK",
            categories: [],
            color: null,
            material: null,
            dimensions: null,
            ctas: ["view"],
          },
        ],
        ctas: ["view"],
        handoff: { show: false, reason: null },
      },
    },
    [fact({ storeCode: "jo_en", currency: "JOD", finalPrice: 189, regularPrice: 355, stockStatus: "OUT_OF_STOCK" })],
    "jo_en",
  );
  assert.equal(v.ok, true);
});

test("pasted PDP link extracts url_key not size digits", () => {
  const parsed = parseMidasProductUrl(
    "what is this https://midasfurniture.com/en/londer-bedroom-set-king-size-193-203-cm-bedrooms-midas.html",
  );
  assert.ok(parsed);
  assert.equal(parsed.store_code, "en");
  assert.equal(parsed.url_key, "londer-bedroom-set-king-size-193-203-cm-bedrooms-midas");
});

test("Qatar store path on a pasted link is recorded", () => {
  const parsed = parseMidasProductUrl(
    "https://www.midasfurniture.com/qtr_en/londer-bedroom-set-king-size-193-203-cm-bedrooms-midas.html?utm=1",
  );
  assert.ok(parsed);
  assert.equal(parsed.store_code, "qtr_en");
  assert.equal(parsed.url_key, "londer-bedroom-set-king-size-193-203-cm-bedrooms-midas");
});

test("cart and homepage URLs are not treated as a piece", () => {
  assert.equal(parseMidasProductUrl("https://midasfurniture.com/en/cart"), null);
  assert.equal(parseMidasProductUrl("https://midasfurniture.com/en"), null);
  assert.equal(parseMidasProductUrl("https://example.com/londer-bedroom-set.html"), null);
});

const londer = {
  sku: "154534",
  name: "LONDER BEDROOM SET KING SIZE (193*203 CM) BLACK",
  categories: ["Home Furniture", "Bedrooms", "King Size Bedroom Sets", "Bedroom Set Without Wardrobe"],
  currency: "KWD" as const,
  regular_price: 995,
  final_price: 495,
  discount_percent: 50,
  stock_status: "IN_STOCK" as const,
};

test("identity headline uses collection plus category", () => {
  assert.equal(pieceHeadline(londer, "en"), "LONDER Bedroom Set");
});

test("mirror catalog has eight products in each department", () => {
  assert.equal([...catalogSrc.matchAll(/department: "living"/g)].length, 8);
  assert.equal([...catalogSrc.matchAll(/department: "dining"/g)].length, 8);
  assert.equal([...catalogSrc.matchAll(/department: "bedrooms"/g)].length, 8);
  assert.equal([...catalogSrc.matchAll(/sku: "/g)].length, 24);
  assert.equal([...catalogSrc.matchAll(/\], true\)/g)].length, 8);
});

test("mirror keeps LONDER Kuwait fixture and Jordan out of stock", () => {
  assert.match(catalogSrc, /sku: "154534"/);
  assert.match(catalogSrc, /book\(\[995, 495\], \[3900, 2100\], \[4280, 2490\], \[355, 189\], \[118, 64\], \["jordan"\]\)/);
});

test("identity reply includes SKU, sale price, FOMO, and add to cart", () => {
  const text = identityReply({ product: londer, country: "Kuwait", lang: "en" });
  assert.match(text, /^LONDER Bedroom Set, SKU 154534, 495 KWD \(was 995\), in stock in Kuwait\./);
  assert.match(text, /50% off/);
  assert.match(text, /Add to cart\?/);
  assert.ok(fomoLine(londer, "Kuwait", "en")?.includes("50%"));
});

test("budget parser reads under-N without converting currency", () => {
  assert.equal(parseBudget("sofa under 300 KWD"), 300);
  assert.equal(parseBudget("أقل من 500"), 500);
});

test("bare numeric SKU is identity, follow-up keeps prior query and budget", () => {
  const bare = extractConstraints([{ role: "user", content: "154534" }]);
  assert.equal(bare.sku, "154534");
  const follow = extractConstraints([
    { role: "user", content: "velvet sofa" },
    { role: "assistant", content: "In-stock in Kuwait." },
    { role: "user", content: "under 800 KWD" },
  ]);
  assert.equal(follow.max_price, 800);
  assert.equal(follow.followUp, true);
  assert.match(follow.query, /velvet sofa/i);
});

test("colour-only follow-up drops prior material and keeps last three SKUs", () => {
  const follow = extractConstraints([
    { role: "user", content: "velvet sofa" },
    { role: "assistant", content: "OVALO, SKU 170423. CASAI, SKU 161621." },
    { role: "user", content: "make it beige" },
  ]);
  assert.equal(follow.color, "beige");
  assert.equal(follow.material, null);
  assert.equal(follow.followUp, true);
  assert.match(follow.query, /velvet sofa/i);
});

test("PII is redacted before catalog search text", () => {
  assert.match(redactPii("call me at +965 12345678 or a@b.com"), /\[phone\]/);
  assert.match(redactPii("call me at +965 12345678 or a@b.com"), /\[email\]/);
});

test("AI product links carry channel UTM", () => {
  const live = "https://midasfurniture.com/en/londer-bedroom-set-king-size-193-203-cm-bedrooms-midas.html";
  const widget = withMidasAiUtm(live, "widget");
  const wa = withMidasAiUtm(live, "whatsapp");
  const ig = withMidasAiUtm(live, "instagram");
  assert.equal(
    widget,
    "https://midasfurniture.com/en/londer-bedroom-set-king-size-193-203-cm-bedrooms-midas.html?utm_source=Midas_AI&utm_medium=widget&utm_campaign=Chatbot",
  );
  assert.equal(
    wa,
    "https://midasfurniture.com/en/londer-bedroom-set-king-size-193-203-cm-bedrooms-midas.html?utm_source=Midas_AI&utm_medium=whatsapp&utm_campaign=Chatbot",
  );
  assert.equal(
    ig,
    "https://midasfurniture.com/en/londer-bedroom-set-king-size-193-203-cm-bedrooms-midas.html?utm_source=Midas_AI&utm_medium=Instagram&utm_campaign=Chatbot",
  );
  assert.equal(
    withMidasAiUtm("/en/ovalo-velvet-sectional-sofa-7-pcs-white-living-room-midas.html", "web"),
    "/en/ovalo-velvet-sectional-sofa-7-pcs-white-living-room-midas.html?utm_source=Midas_AI&utm_medium=widget&utm_campaign=Chatbot",
  );
});
