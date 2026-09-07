# Middleware API — Phase 1 (website)

The model never calls Magento. It calls these endpoints on **your** server. Middleware adds the Magento `Store` header and maps the response into a product DTO. If Magento fails, return an error object; do not invent a product.

Base URL: your orchestrator, e.g. `https://ai.midasfurniture.com` (internal).  
Catalog: `POST https://midasfurniture.com/graphql`

Every tool request **must** include `store_code` from the injected session. Reject unknown codes.

Allowed: `en`, `ar`, `qtr_en`, `qtr_ar`, `ksa_en`, `ksa_ar`, `jo_en`, `jo_ar`, `bhr_en`, `bhr_ar`.

---

## Product DTO (what tools return, what cards use)

```json
{
  "sku": "167848",
  "name": "REUNION DINING CHAIR - BLACK",
  "brand": "Kare Design",
  "image_url": "https://midasfurniture.com/media/catalog/product/...",
  "url_key": "reunion-dining-chair-dining-rooms-midas",
  "pdp_url": "https://midasfurniture.com/en/reunion-dining-chair-dining-rooms-midas.html",
  "regular_price": 85,
  "final_price": 72.25,
  "currency": "KWD",
  "discount_percent": 15,
  "stock_status": "IN_STOCK",
  "categories": ["Dining Rooms", "Dining Chairs", "Kare Design"],
  "color": "Black",
  "material": null,
  "dimensions": null
}
```

`pdp_url` = `https://midasfurniture.com` + session `base_path` + `url_key` + `.html`, plus AI UTMs (`utm_source=Midas_AI`, `utm_campaign=Chatbot`, `utm_medium=widget|whatsapp|Instagram` from `channel`).

On `Store: ar`, `name` and `categories` come back in Arabic from Magento. Do not translate in middleware.

`color` / `material` on Magento are option IDs (`color: 10`). Middleware must resolve labels via `customAttributeMetadata` (cache the option map). If the label is missing, send `null` — never send `"10"` to the model.

`brand`: if Magento `manufacturer` is empty, derive from categories when a category is exactly `Kare Design` or `Ashley` / `Ashley Homestore`. Otherwise `null`.

---

## Magento GraphQL header

```http
POST https://midasfurniture.com/graphql
Content-Type: application/json
Store: ksa_en
```

Live check already works: `storeConfig.store_code` + `default_display_currency_code` match the session table.

---

## `POST /v1/tools/search_catalog`

### Request

```json
{
  "store_code": "en",
  "query": "emerald velvet accent chair",
  "category": null,
  "brand": "Kare Design",
  "color": "green",
  "material": "velvet",
  "room": "living",
  "max_price": 250,
  "in_stock_only": true,
  "page_size": 3
}
```

`room: "majlis"` or `"diwaniya"` → Magento living/seating search text (sofa, chair, centre table). **Never** map majlis to dining.

Retrieval is hybrid: Magento keyword hits plus optional Pinecone SKUs, fused with BM25 + local vectors, then reranked. Cards still use Magento `final_price` / `stock_status` from this turn.

### Magento query (shape)

```graphql
query Search($search: String!, $pageSize: Int!) {
  products(search: $search, pageSize: $pageSize, filter: { stock_status: { eq: "IN_STOCK" } }) {
    total_count
    items {
      sku
      name
      url_key
      stock_status
      color
      material
      manufacturer
      categories { name }
      ... on SimpleProduct {
        image { url }
      }
      price_range {
        minimum_price {
          regular_price { value currency }
          final_price { value currency }
          discount { percent_off }
        }
      }
    }
  }
}
```

Build `$search` from `query` + brand + color + material + room synonyms. Prefer Magento `filter` when you have a category id; otherwise search text is enough for Phase 1.

### Response

```json
{
  "ok": true,
  "store_code": "en",
  "currency": "KWD",
  "products": [ { "...": "Product DTO" } ]
}
```

Empty catalog: `ok: true`, `products: []`. Magento down: `ok: false`, `error: "catalog_unavailable"`.

---

## `POST /v1/tools/get_product`

### Request

```json
{ "store_code": "en", "sku": "167848" }
```

### Magento

```graphql
query GetProduct($sku: String!) {
  products(filter: { sku: { eq: $sku } }) {
    items {
      sku
      name
      url_key
      stock_status
      color
      material
      manufacturer
      categories { name }
      ... on SimpleProduct {
        image { url }
        media_gallery { url label }
      }
      price_range {
        minimum_price {
          regular_price { value currency }
          final_price { value currency }
          discount { percent_off }
        }
      }
    }
  }
}
```

Verified live on Kuwait English: SKU `167848` → `REUNION DINING CHAIR - BLACK`, `72.25` KWD (was `85`, 15% off), `IN_STOCK`. Same SKU with `Store: ar` returns the Arabic name.

Not found: `ok: false`, `error: "not_found"`.

---

## `POST /v1/tools/check_stock`

Same Magento query as `get_product`, return only:

```json
{
  "ok": true,
  "store_code": "jo_en",
  "sku": "167848",
  "stock_status": "IN_STOCK",
  "qty": null
}
```

Do not invent `qty` if Magento only exposes `stock_status`. Jordan vs Kuwait can differ; never reuse another store’s result.

---

## `POST /v1/tools/get_policy`

Not Magento GraphQL in Phase 1. Serve a static JSON pack per website (Kuwait / Qatar / KSA / Jordan / Bahrain), edited by marketing from the live FAQ.

### Request

```json
{ "store_code": "en", "topic": "delivery" }
```

Topics: `delivery`, `returns`, `payments`, `wallet`, `showrooms`, `hours`, `installation`, `customization`, `customer_care`, `complaints`.

Copy lives in `knowledge/<website>/en.md` and `ar.md` (markdown `## topic` sections). Marketing can edit those files without changing Magento. The bot must not invent another country’s phone number.

### Response

```json
{
  "ok": true,
  "store_code": "en",
  "topic": "customization",
  "text": "We do not offer customization. Products are ready-made by international factories and brands."
}
```

Until the pack is filled, `customization` can be this sentence for all stores (confirmed on the Kuwait FAQ). Delivery/Wallet text must **not** be hardcoded in the LLM prompt — put the official FAQ wording here, per country, after ops confirms Wallet vs free-delivery.

---

## `POST /v1/tools/visual_search` (after text search works)

### Request

```json
{
  "store_code": "en",
  "image_ref": "https://… or upload id",
  "user_note": "Do you have something like this?"
}
```

### Middleware steps (visual search)

1. Vision model → JSON attributes `{ category, colors, materials, style, room }` (map majlis → seating).
2. Call the same hybrid `search_catalog` path (lexical + vectors + rerank). Magento remains price/stock truth.
3. Return products plus `match_type`: `"style"` unless you later add image embeddings.

```json
{
  "ok": true,
  "vision": {
    "category": "accent chair",
    "colors": ["emerald", "gold"],
    "materials": ["velvet", "metal"],
    "room": "living"
  },
  "products": []
}
```

If vision fails: `ok: false`, `error: "vision_unavailable"` — the model must ask for a text description, not guess a SKU.

---

## `POST /v1/tools/escalate_to_human`

Store the transcript, `store_code`, optional `order_id`, and return the country care path from the policy pack (Kuwait FAQ: WhatsApp / hotline 1888886, `customercare@midasfurniture.com`). Do not invent other countries’ numbers.

---

## Orchestrator wiring

```text
widget  --session JSON + user message-->  POST /v1/chat
chat handler:
  1. validate session.store_code
  2. messages = [system prompt, SESSION_CONTEXT, history, user]
  3. LLM tool loop → /v1/tools/*
  4. assistant message + ui.products copied from tool DTOs only
```

GraphQL `Store` header on every Magento call = `session.store_code`. That is the entire multi-country mechanism.

---

## Out of Phase 1 middleware

`get_wallet_status`, Magento `addProductsToCart` cookies, `get_current_promotions` as a separate CMS feed, AR/3D. Promotions for launch = `final_price` vs `regular_price` on the product DTO. Pinecone is optional L4 recall — copy-only, store-scoped.
