# What to do next

Source of truth: **Combined System v1.1** (`docs/combined-system-v1.1.md`). Website only until prices stay grounded.

## Already done (this slice)

- Part A runtime prompt
- Magento GraphQL tools + knowledge markdown
- Arabic normalization / Arabizi / majlis synonyms at query time (Branch B middleware fallback)
- Send-gate verifier on `/api/chat`
- Design system + live sale categories / `get_current_promotions`

## Blocked on Magento / ops (`[VERIFY]` in B1)

- Elasticsearch analyzer diagnostic (B2.1) — no ES host here; middleware normalization is the fallback
- `TRUTH_TTL_MS` from measured MSI p95
- Human hours / WhatsApp numbers per remaining countries (Bahrain locator unpublished)
- Server-side GTM

## Not this slice

- Pinecone / hybrid retrieval, SSE streaming, GTM thank-you, WhatsApp, memory, add-to-cart GraphQL
- 3D / AR, Wallet live balance, a live multi-agent tree

## Owner split

- **Marketing:** Part A stays frozen except via this combined spec; edit `knowledge/<country>/*.md` for care copy.
- **Engineering:** Magento GraphQL + verifier + retrieval layers in B2–B4.
