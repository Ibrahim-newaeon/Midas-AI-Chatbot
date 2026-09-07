import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRestPayload, parseCsv } from "./importedCatalog.ts";

const CSV = `sku,name,price,regular_price,currency,stock,url,image,category,brand,color,material
101,Velvet sofa,800,1000,USD,IN_STOCK,https://shop.example/sofa,https://shop.example/sofa.jpg,Living,Acme,beige,velvet
102,Oak dining table,450,450,USD,0,https://shop.example/table,https://shop.example/table.jpg,Dining,Acme,oak,wood
`;

test("parseCsv maps sku name price stock and sale percent inputs", () => {
  const rows = parseCsv(CSV);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].sku, "101");
  assert.equal(rows[0].final_price, 800);
  assert.equal(rows[0].regular_price, 1000);
  assert.equal(rows[0].stock_status, "IN_STOCK");
  assert.equal(rows[0].color, "beige");
  assert.equal(rows[1].stock_status, "OUT_OF_STOCK");
});

test("normalizeRestPayload accepts products array", () => {
  const rows = normalizeRestPayload(
    {
      products: [{ sku: "9", name: "Lamp", price: 40, url: "https://x.test/lamp", stock: "IN_STOCK" }],
    },
    "EUR",
  );
  assert.equal(rows[0].sku, "9");
  assert.equal(rows[0].final_price, 40);
  assert.equal(rows[0].currency, "EUR");
});
