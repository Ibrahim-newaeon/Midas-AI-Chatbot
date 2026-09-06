# Midas AI — Website Phase 1

Website shopping assistant for [Midas Furniture](https://midasfurniture.com/). It talks to the live Magento GraphQL catalog (`Store` header per country/language). WhatsApp and Instagram are out of scope.

## Run locally

```bash
npm install
npm run build
npm start
```

Opens on [http://127.0.0.1:43217](http://127.0.0.1:43217).

Optional `env.example` values:

- `MAGENTO_GRAPHQL_URL` — defaults to `https://midasfurniture.com/graphql`
- `OPENAI_API_KEY` — only used to describe an uploaded photo before catalog search. Without it, photo search uses the caption you type.

## What is implemented

- Store-aware session (`en`, `ar`, `qtr_en`, `ksa_ar`, …) with KWD / QAR / SAR / JOD / BHD
- Tools: `search_catalog`, `get_product`, `check_stock`, `get_policy`
- Chat UI with product cards that open the real Midas PDP
- Majlis queries search seating, not dining
- No invented SKUs, no AR, no cross-country stock

## Key files

| Path | Role |
|---|---|
| `prompts/midas-ai-website-system.md` | Website system prompt |
| `lib/magento.ts` | GraphQL client + `Store` header |
| `lib/tools.ts` | Middleware tools |
| `app/api/chat/route.ts` | Orchestrator endpoint |
| `components/chat-widget.tsx` | Website widget |
| `docs/middleware-api.md` | Tool contracts |
| `docs/session-injection.md` | Magento URL / cookie session |
| `widget/resolve-session.js` | Storefront helper to drop into Magento later |

## Magento embed (next)

On the Magento theme, read `BASE_URL`, POST `/api/chat` with `session` from `widget/resolve-session.js`. See `docs/session-injection.md`.
