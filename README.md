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

- `MAGENTO_GRAPHQL_URL` — defaults to `https://midasfurniture.com/graphql`
- `OPENAI_API_KEY` — only used to describe an uploaded photo before catalog search. Without it, photo search uses the caption you type.

## What is implemented

- Store-aware session (`en`, `ar`, `qtr_en`, `ksa_ar`, …) with KWD / QAR / SAR / JOD / BHD
- Tools: `search_catalog`, `get_product`, `check_stock`, `get_policy`, sale-category offers
- **Knowledge pack** in `knowledge/<country>/en.md` and `ar.md` — showrooms, hours, customer care, complaints (editable markdown, not Magento)
- Chat UI follows `design-system.xml` (Nord, Playfair Display, Noto Kufi Arabic, Magento buttons and prices)
- “What’s on offer?” reads live Magento sale categories — not a keyword search for the word “offers”
- Majlis queries search seating, not dining
- No invented SKUs, no AR, no cross-country stock

## Key files

| Path | Role |
|---|---|
| `prompts/midas-ai-website-system.md` | Website system prompt |
| `design-system.xml` | Extracted Magento theme tokens (Nord, Playfair, Noto Kufi, #121111 / #B22020 / #F5CD6F) |
| `knowledge/<country>/*.md` | Editable FAQ: showrooms, hours, customer care, complaints |
| `lib/magento.ts` | GraphQL client + `Store` header |
| `lib/tools.ts` | Middleware tools |
| `app/api/chat/route.ts` | Orchestrator endpoint |
| `components/chat-widget.tsx` | Website widget |
| `docs/middleware-api.md` | Tool contracts |
| `docs/session-injection.md` | Magento URL / cookie session |
| `widget/resolve-session.js` | Storefront helper to drop into Magento later |

## Magento embed (next)

On the Magento theme, read `BASE_URL`, POST `/api/chat` with `session` from `widget/resolve-session.js`. See `docs/session-injection.md`.
