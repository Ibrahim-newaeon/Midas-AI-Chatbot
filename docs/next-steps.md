# What to do next

Source of truth: **Combined System v1.1** (`docs/combined-system-v1.1.md`). Website only until prices stay grounded.

The live checklist (**Done / Partial / Not implemented / Waiting on live**) lives in the [README](../README.md#checklist-done--partial--not-implemented--waiting-on-live). Keep that table in sync when we ship extras (paste-a-link, UTM, widget, mirror catalog).

## Go-live (the live version)

1. Host this app and add `<script src="https://YOUR_HOST/widget/midas-ai.js">` on the Magento theme (after `BASE_URL`).
2. Confirm store / language / currency / PDP `page_sku` on a real Midas page.
3. Hook `midas:add_to_cart` so Add to cart hits the **live** Magento cart.
4. Optional: thank-you GTM + `chat_session_id` on the order.
5. Elasticsearch analyzer diagnostic (B2.1) when an ES host exists; until then Branch B middleware stays.
6. Set `TRUTH_TTL_MS` from measured Magento p95 (rehearsal default `120000` in `env.example`).

## Later (not Phase 1)

- Pinecone / hybrid vector retrieval, SSE token streaming, WhatsApp/Meta, Phase 9 memory
- 3D / AR, Wallet live balance, seven-mode search experience, a live multi-agent tree
- Golden eval set, model bake-off, Playwright, k6
- JSON-LD on live Magento PDPs (mirror PDPs already have it)

## Owner split

- **Marketing:** Part A stays frozen except via this combined spec; edit `knowledge/<country>/*.md` for care copy.
- **Engineering:** Magento GraphQL + verifier + retrieval layers in B2–B4.
