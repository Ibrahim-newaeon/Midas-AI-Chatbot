# What to do next (Phase 1 sequence)

Website only. Magento GraphQL is the catalog. Meta/WhatsApp stay closed until the widget does not hallucinate prices.

## Already done

1. Website system prompt — `prompts/midas-ai-website-system.md`
2. Product-card JSON schema (no AR) — `prompts/web-ui-payload.schema.json`
3. Session JSON from Magento `BASE_URL` / path / `store` cookie — `widget/resolve-session.js`, `docs/session-injection.md`

## Do now (engineering)

**Middleware + Magento GraphQL mapping** — exact tool contracts in `docs/middleware-api.md`. This is the next build, not another prompt rewrite.

The middleware is a small API. The model calls `search_catalog`; middleware sends `POST https://midasfurniture.com/graphql` with header `Store: <store_code>` and returns a product DTO the widget can render.

## Then, in this order

| Order | Work | Done when |
|---|---|---|
| 1 | Middleware: `search_catalog`, `get_product`, `check_stock`, `get_policy` | Same SKU on `/en/` vs `/ksa_en/` returns KWD vs SAR, real `url_key` |
| 2 | Orchestrator: cached system prompt + injected session + tool loop | Chat reply never contains a price that is not in a tool result |
| 3 | Magento widget: session resolver + cards (`view`, `add_to_cart` link, `handoff`) | “Try Midas AI” on Kuwait EN + AR returns 1–3 live cards |
| 4 | `visual_search` Phase 1 (vision attributes → same `search_catalog`) | Pinterest chair photo → in-stock cards, copy says “closest” unless exact |
| 5 | Optional `add_to_cart` via Magento GraphQL cart | Click in chat updates Magento minicart |
| — | **Stop and test** using `docs/stress-tests.md` | All five scenarios pass |
| Phase 2 | WhatsApp / Instagram adapters | Only after stress tests pass |

## Explicitly not next

- Pinecone / CLIP index
- 3D / AR buttons
- Wallet live balance
- Mega prompt chapters for WhatsApp or Instagram
- New catalog tagging program for 20% of SKUs

## Suggested owner split

- **Marketing / brand:** keep the website prompt frozen; edit `knowledge/<country>/en.md` and `ar.md` for showrooms, hours, customer care, complaints, delivery, and returns.
- **Engineering:** implement `docs/middleware-api.md` against live Magento GraphQL.
