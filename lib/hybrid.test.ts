import assert from "node:assert/strict";
import test from "node:test";
import { cosine, embedText } from "./embeddings.ts";
import { hybridRank } from "./hybridSearch.ts";
import { judgeTurn } from "./evalJudge.ts";
import { lastSpokenSkus } from "./queryUnderstanding.ts";
import { pineconeEnabled } from "./pinecone.ts";

const sofa = { sku: "170423", text: "OVALO VELVET SECTIONAL SOFA WHITE living sofa كنب", inStock: true };
const beige = { sku: "161621", text: "CASAI SECTIONAL SOFA BEIGE living sofa كنب", inStock: true };
const dining = { sku: "152723", text: "JORLAINA DINING TABLE SET 6 CHAIRS dining سفرة طعام", inStock: true };

test("hashed embeddings are cosine-similar for near-duplicate copy", () => {
  const a = embedText("OVALO velvet sectional sofa");
  const b = embedText("OVALO velvet sectional sofa white");
  const c = embedText("JORLAINA dining table set chairs");
  assert.ok(cosine(a, b) > cosine(a, c));
});

test("hybrid rank keeps majlis seating above dining tables", () => {
  const skus = hybridRank({
    query: "bagi kanaba lel majles",
    docs: [sofa, beige, dining],
    room: "majlis",
    limit: 3,
  });
  assert.ok(skus.includes("170423") || skus.includes("161621"));
  assert.notEqual(skus[0], "152723");
});

test("hamza sofa variants rank the same seating SKU first", () => {
  const docs = [
    { sku: "1", text: "أريكة كنب غرفة معيشة", inStock: true },
    { sku: "2", text: "طقم طاولة طعام سفرة", inStock: true },
  ];
  const a = hybridRank({ query: "أريكة", docs, limit: 1 });
  const b = hybridRank({ query: "اريكة", docs, limit: 1 });
  const c = hybridRank({ query: "اريكه", docs, limit: 1 });
  assert.equal(a[0], "1");
  assert.equal(b[0], "1");
  assert.equal(c[0], "1");
});

test("last three SKUs are remembered from assistant copy", () => {
  const skus = lastSpokenSkus([
    { role: "assistant", content: "OVALO, SKU 170423, 1395 KWD." },
    { role: "assistant", content: "CASAI, SKU 161621, 735 KWD." },
    { role: "assistant", content: "LONDER Bedroom Set, SKU 154534, 495 KWD." },
    { role: "user", content: "make it beige" },
  ]);
  assert.deepEqual(skus, ["154534", "161621", "170423"]);
});

test("eval judge fails an ungrounded KD-884 SKU", () => {
  const judged = judgeTurn({
    id: "fake",
    store_code: "en",
    expect: { cards_from_tools: true },
    turn: {
      message: "Try KD-884",
      used_tools: [],
      engine: "rules",
      ui: {
        products: [
          {
            sku: "KD-884",
            name: "fake",
            title: "fake",
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
  });
  assert.equal(judged.pass, false);
});

test("Pinecone stays off without credentials", () => {
  assert.equal(pineconeEnabled(), false);
});
