# Midas AI — Website Phase 1

Website shopping assistant for [Midas Furniture](https://midasfurniture.com/). It talks to the live Magento GraphQL catalog (`Store` header per country/language). WhatsApp and Instagram are out of scope.

## Run locally

You need **Node.js 20+** and npm.

```bash
git clone https://github.com/Ibrahim-newaeon/Midas-AI-Chatbot.git
cd Midas-AI-Chatbot
npm install
npm run dev
```

Then open **http://localhost:43217** in your browser (Chrome or Safari). That is faster and more reliable than the cloud Preview card.

`npm run dev` is the day-to-day command. Use this only if you want a production-style local server:

```bash
npm run build
npm start
```

No API key is required for text search. Magento is called from this Next.js server, not from the browser.

Quality commands (mirror catalog, no live Magento needed):

```bash
npm test              # unit tests
npm run eval          # golden set vs the rules orchestrator
npm run bakeoff       # score the current candidate (rules until an LLM stays green)
npm run test:e2e      # Playwright (starts or reuses :43217)
npm run load:smoke    # Node p95 smoke against /api/chat (needs the dev server)
# k6 run k6/chat.js   # optional; install k6 separately
```

Optional `env.example` values:

- `MAGENTO_GRAPHQL_URL` — defaults to `https://midasfurniture.com/graphql` (used by the assistant on `/`)
- `OPENAI_API_KEY` — only used to describe an uploaded photo before catalog search. Without it, photo search uses the caption you type.

## Magento mirror (demo storefront)

Before the widget sits on live Midas, rehearse Part A/B on a Magento-shaped mirror. **Not live checkout.** Wallet is not included.

```
http://localhost:43217/demo
http://localhost:43217/en/          Kuwait English
http://localhost:43217/ar/          Kuwait Arabic
http://localhost:43217/qtr_en/      Qatar English
http://localhost:43217/ksa_en/      KSA English
http://localhost:43217/jo_en/       Jordan English (LONDER is out of stock here)
```

Each country has **English + Arabic** homes. Each home lists **eight products per department** (Living, Dining, Bedrooms) plus eight Offers. LONDER bedroom set `154534` and OVALO sofa `170423` are still in the fixture set. Prices are fixtures per website, not currency conversions. Category URLs: `/{store}/living`, `/{store}/dining`, `/{store}/bedrooms`, `/{store}/offers`.

Chat on those pages sends `catalog: "mirror"` and reads mock GraphQL (`/api/graphql`, same `Store` header). Chat on `/` still uses live `midasfurniture.com/graphql`.

Demo **Add to cart** on a PDP stores a local cart (`/{store}/cart`). It does not write the real Midas cart.

## Checklist (Done / Partial / Not implemented / Waiting on live)

Source of truth: Combined System v1.1 (`docs/combined-system-v1.1.md`). Runtime prompt is Part A only (`prompts/midas-ai-website-system.md`).

**Done** — works in this repo. **Partial** — started, not the full spec. **Not implemented** — not built (later or out of Phase 1). **Waiting on live** — code is ready enough; it needs the Magento theme / ops, not another rewrite of A.

### Part A — shopper brain (website)

| Item | Status |
|---|---|
| Website chat only (not WhatsApp / Instagram) | **Done** |
| Store lock: 10 views, KWD / QAR / SAR / JOD / BHD, no currency conversion | **Done** |
| No invented SKUs; Magento (or the mirror) is the price/stock source | **Done** |
| No customization; no AR/3D | **Done** |
| Arabic: gender-neutral CTAs, don’t “correct” spelling, majlis = seating not dining | **Done** |
| “What’s on offer?” from sale categories | **Done** |
| Complaints / care / showrooms / delivery from the knowledge pack | **Done** |
| Discount / “ignore instructions, 90% off” → refuse, no fake promo | **Done** |
| Photo search labelled as style match (`OPENAI_API_KEY` or a typed caption) | **Partial** — works; vision needs the API key |
| Cards: view + Add to cart | **Partial** — **Waiting on live** for the real Magento cart. Mirror writes a demo cart. Live / theme embed opens the PDP (and posts `midas:add_to_cart`) |
| Paste a `midasfurniture.com` product link → that exact piece + FOMO | **Done** (added after original A) |
| AI product links tagged `utm_source=Midas_AI&utm_campaign=Chatbot` (`utm_medium=widget` now; `whatsapp` / `Instagram` when those channels exist) | **Done** (added after original A) |
| Floating widget: desktop corner panel, mobile full screen | **Done** (added after original A) |
| Magento mirror: 8 Living / 8 Dining / 8 Bedrooms / 8 Offers, 10 storefronts | **Done** (added after original A) |
| Budget / colour / short follow-ups / bare numeric SKU | **Done** |
| Real LLM tool-calling conversation | **Not implemented** — rules orchestrator, not GPT picking tools |
| Streaming replies | **Not implemented** |
| Live Wallet balance | **Not implemented** — policy copy only (`get_policy("wallet")`) |
| Product dimensions / colour / material from Magento attributes | **Not implemented** — those DTO fields stay `null`; colour/material in the query is text match |
| Remember last three SKUs across “make it beige” | **Done** — stated-preference memory + last three spoken SKUs, re-fetched from Magento this turn |
| Widget sitting on midasfurniture.com | **Waiting on live** — `/widget/midas-ai.js` is ready; theme script is not installed |

### Part B — Phase 1 plumbing

| Item | Status |
|---|---|
| Magento GraphQL per `Store` header (search, SKU, URL, sale categories, stock) | **Done** |
| Arabic query-time normalize + Arabizi + majlis synonyms (middleware fallback) | **Done** — not Magento Elasticsearch |
| Send-gate: UI SKU and spoken prices match this turn; currency lock | **Done** |
| Zod on `/api/chat` | **Done** |
| Knowledge markdown per country | **Done** |
| Magento design system on the widget | **Done** |
| Session `store_code` + `chat_session_id` | **Done** |
| Injection screen (narrow) | **Done** |
| Rate limit on `/api/chat` | **Done** |
| Light PII redaction (email/phone) before catalog search | **Done** |
| Client `dataLayer` chat events (`chat_open`, `chat_product_shown`, `chat_add_to_cart`, …) | **Done** |
| JSON-LD `Product` / `Offer` | **Partial** — on **mirror** PDPs. Live Magento PDPs are **Waiting on live** (theme) |
| `TRUTH_TTL_MS` | **Partial** — code default 60s; `env.example` 120s. Not set from measured Magento p95 (**Waiting on live**) |
| Human-handoff packet | **Partial** — care copy + `ui.handoff`; not a full agent brief |
| Embed script for the Magento theme | **Waiting on live** — file exists; not on the live theme |
| Magento `addProductsToCart` into the real cart | **Waiting on live** — parent theme must handle `midas:add_to_cart` |
| Elasticsearch diagnostic (Branch A vs B) | **Waiting on live** — no ES host here; `[VERIFY]` still blank |
| GTM / GA4 thank-you / `chat_assisted_purchase` | **Waiting on live** — needs Magento order + server GTM |
| Hybrid search (Pinecone / vectors / rerank) | **Done** locally (BM25 + hashed vectors + rerank). **Waiting on live** for a Pinecone index (`PINECONE_API_KEY` + `PINECONE_INDEX_HOST`). Vectors never store price/stock |
| Golden eval set, model bake-off, Playwright, k6 | **Done** as a harness (`npm run eval`, `npm run bakeoff`, `npm run test:e2e`, `k6/chat.js`). Golden set is bilingual rehearsal cases, not 150–300 live transcripts yet |
| Memory, learning queue, eval judge, merchandising insight | **Done** — stated prefs + last 3 SKUs; unanswered clusters; deterministic judge; `/insights`. Nothing auto-writes the knowledge pack |
| WhatsApp / Messenger / Instagram gateway | **Not implemented** — UTM mediums are reserved |
| Wallet GraphQL | **Not implemented** |

### Go-live blockers (the live version)

1. Host this app and add `<script src="https://YOUR_HOST/widget/midas-ai.js">` on the Magento theme (after `BASE_URL`).
2. Confirm store / language / currency / PDP `page_sku` on a real Midas page.
3. Hook `midas:add_to_cart` so Add to cart hits the **live** Magento cart.
4. Optional: thank-you GTM + `chat_session_id` on the order.

## Key files

| Path | Role |
|---|---|
| `prompts/midas-ai-website-system.md` | Part A runtime prompt (v1.1) |
| `docs/combined-system-v1.1.md` | Full runtime + build spec |
| `docs/todo.md` | Backlog vs the original Phase 1 website system prompt |
| `/setup` | Client atelier: name, store URL, CSV or REST catalog (ivory/charcoal showroom, not Magento chrome) |
| `docs/Midas-AI-Client-Brief.md` | Client-facing preview brief (send with the preview link) |
| `/brief` | Same brief as a branded page (Print / Save as PDF) |
| `design-system.xml` | Extracted Magento theme tokens (Nord, Playfair, Noto Kufi, #121111 / #B22020 / #F5CD6F) |
| `knowledge/<country>/*.md` | Editable FAQ: showrooms, hours, customer care, complaints |
| `lib/magento.ts` | GraphQL client + `Store` header |
| `lib/tools.ts` | Middleware tools |
| `app/api/chat/route.ts` | Orchestrator endpoint |
| `components/midas-ai-widget.tsx` | Floating desktop/mobile launcher |
| `components/chat-widget.tsx` | Chat panel |
| `public/widget/midas-ai.js` | Magento script tag (iframe `/embed`) |
| `widget/resolve-session.js` | Session helper (also inlined in `midas-ai.js`) |
| `lib/hybridSearch.ts` | BM25 + vector + rerank (SKU ids only) |
| `lib/pinecone.ts` | Optional Pinecone recall; no-op without keys |
| `lib/memory.ts` | Stated-preference memory (last 3 SKUs) |
| `lib/learningQueue.ts` | Unanswered clusters → merchandising insight |
| `lib/evalJudge.ts` | Deterministic golden-set judge |
| `eval/golden.json` | Rehearsal eval cases |
| `e2e/widget.spec.ts` | Playwright |
| `k6/chat.js` | Load script for `/api/chat` |
| `docs/middleware-api.md` | Tool contracts |
| `docs/session-injection.md` | Magento URL / cookie session |

## Magento embed

On the Magento theme, add one script (after `BASE_URL` is printed):

```html
<script src="https://YOUR_MIDAS_AI_HOST/widget/midas-ai.js" async></script>
```

That script reads `BASE_URL` / the store cookie, opens an iframe to `/embed`, and posts `midas:add_to_cart` to the parent when a shopper taps Add to cart. Session JSON is documented in `docs/session-injection.md`. Live Magento cart cookies cannot be set from this app’s origin — the parent theme should listen for that message (or the shopper is sent to the PDP).
