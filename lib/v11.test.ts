import assert from "node:assert/strict";
import test from "node:test";
import { expandArabiziLexicon, expandSearchQueries, normalizeArabic } from "./arabicNormalize.ts";
import { parseMidasProductUrl } from "./productLink.ts";
import { verifySendGate, type ProductTruth } from "./verifier.ts";

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
