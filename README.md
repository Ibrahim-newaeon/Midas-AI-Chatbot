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

## What is implemented

- **Website widget** — floating launcher on desktop (corner panel) and full-screen on mobile (`Try Midas AI`). Magento drop-in: `/widget/midas-ai.js` → iframe `/embed`
- Store-aware session (`en`, `ar`, `qtr_en`, `ksa_ar`, …) with KWD / QAR / SAR / JOD / BHD
- Runtime prompt is **Part A** of Combined System v1.1 (`prompts/midas-ai-website-system.md`). Full spec: `docs/combined-system-v1.1.md`
- Tools: `search_catalog`, `get_product`, `check_stock`, `get_policy`, `get_current_promotions`
- Query understanding: budget (`under 300`), colour/material, follow-up turns, bare numeric SKU identity
- Arabic query normalization + Arabizi lexicon before Magento search (middleware fallback; Magento ES analyzer not changed)
- Send-gate verifier: UI SKUs and spoken prices must match this turn’s Magento facts
- **Knowledge pack** in `knowledge/<country>/en.md` and `ar.md` — showrooms, hours, customer care, complaints (editable markdown, not Magento)
- Chat UI follows `design-system.xml` (Nord, Playfair Display, Noto Kufi Arabic, Magento buttons and prices)
- “What’s on offer?” reads live Magento sale categories — not a keyword search for the word “offers”
- Majlis queries search seating, not dining
- Pasted `midasfurniture.com` product links **load that piece**: exact Magento `url_key` lookup, then identity copy (`LONDER Bedroom Set, SKU 154534, 495 KWD…`), a grounded FOMO line, and Add to cart
- **Magento mirror** at `/demo` and `/{store}/` — EN+AR storefronts, fixture catalog, local demo cart. `/` still uses live Magento.
- JSON-LD `Product`/`Offer` on mirror PDPs (per store currency). Client `dataLayer` events: `chat_open`, `chat_first_message`, `chat_product_shown`, `chat_add_to_cart`, `chat_handoff_human`

## Key files

| Path | Role |
|---|---|
| `prompts/midas-ai-website-system.md` | Part A runtime prompt (v1.1) |
| `docs/combined-system-v1.1.md` | Full runtime + build spec |
| `design-system.xml` | Extracted Magento theme tokens (Nord, Playfair, Noto Kufi, #121111 / #B22020 / #F5CD6F) |
| `knowledge/<country>/*.md` | Editable FAQ: showrooms, hours, customer care, complaints |
| `lib/magento.ts` | GraphQL client + `Store` header |
| `lib/tools.ts` | Middleware tools |
| `app/api/chat/route.ts` | Orchestrator endpoint |
| `components/midas-ai-widget.tsx` | Floating desktop/mobile launcher |
| `components/chat-widget.tsx` | Chat panel |
| `public/widget/midas-ai.js` | Magento script tag (iframe `/embed`) |
| `widget/resolve-session.js` | Session helper (also inlined in `midas-ai.js`) |
| `docs/middleware-api.md` | Tool contracts |
| `docs/session-injection.md` | Magento URL / cookie session |

## Magento embed

On the Magento theme, add one script (after `BASE_URL` is printed):

```html
<script src="https://YOUR_MIDAS_AI_HOST/widget/midas-ai.js" async></script>
```

That script reads `BASE_URL` / the store cookie, opens an iframe to `/embed`, and posts `midas:add_to_cart` to the parent when a shopper taps Add to cart. Session JSON is documented in `docs/session-injection.md`. Live Magento cart cookies cannot be set from this app’s origin — the parent theme should listen for that message (or the shopper is sent to the PDP).
