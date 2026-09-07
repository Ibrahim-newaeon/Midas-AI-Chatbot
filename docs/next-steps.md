# What to do next

Source of truth: **Combined System v1.1** (`docs/combined-system-v1.1.md`). Website only until prices stay grounded.

## Already done (this slice)

- Part A runtime prompt + rules orchestrator
- Magento GraphQL tools + knowledge markdown
- Arabic normalization / Arabizi / majlis synonyms at query time (Branch B middleware fallback)
- Query understanding: budget, colour/material, follow-up, bare SKU
- Send-gate verifier on `/api/chat` (rate limit + Zod)
- Design system + live sale categories / `get_current_promotions`
- Desktop + mobile website widget (launcher / full-screen) + Magento `midas-ai.js` embed
- JSON-LD on mirror PDPs; client dataLayer chat events
- Magento mirror catalog (8 products per department)

## Blocked on Magento / ops (`[VERIFY]` in B1)

- Elasticsearch analyzer diagnostic (B2.1) — no ES host here; middleware normalization is the fallback (Branch B)
- `TRUTH_TTL_MS` from measured MSI p95 — rehearsal default `120000` in `env.example`
- Human hours / WhatsApp numbers per remaining countries (Bahrain locator unpublished)
- Server-side GTM / thank-you `chat_assisted_purchase` (needs Magento order attribute)
- Live Magento `addProductsToCart` cookies (parent theme must handle `midas:add_to_cart`)

## Not this slice (still later)

- Pinecone / hybrid vector retrieval, SSE token streaming, WhatsApp/Meta, Phase 9 memory
- 3D / AR, Wallet live balance, seven-mode search experience, a live multi-agent tree

## Owner split

- **Marketing:** Part A stays frozen except via this combined spec; edit `knowledge/<country>/*.md` for care copy.
- **Engineering:** Magento GraphQL + verifier + retrieval layers in B2–B4.
