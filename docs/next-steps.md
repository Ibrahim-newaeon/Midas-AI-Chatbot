# What to do next

Source of truth: **Combined System v1.1** (`docs/combined-system-v1.1.md`). Website only until prices stay grounded.

The live checklist (**Done / Partial / Not implemented / Waiting on live**) lives in the [README](../README.md#checklist-done--partial--not-implemented--waiting-on-live). Keep that table in sync when we ship extras (paste-a-link, UTM, widget, mirror catalog, hybrid/eval/memory).

Open gaps vs the original Phase 1 website prompt: **[docs/todo.md](todo.md)**. Treat that list as the working backlog until each box is Done or explicitly out of scope.

## Quality loop (this slice)

```bash
npm test
npm run eval
npm run bakeoff
npm run test:e2e
```

`eval/reports/latest.json` is gitignored. Pinecone is optional — local hybrid ranking runs without it. Do not promote an LLM primary engine until the golden set stays green.

## Go-live (the live version)

1. Host this app and add `<script src="https://YOUR_HOST/widget/midas-ai.js">` on the Magento theme (after `BASE_URL`).
2. Confirm store / language / currency / PDP `page_sku` on a real Midas page.
3. Hook `midas:add_to_cart` so Add to cart hits the **live** Magento cart.
4. Optional: thank-you GTM + `chat_session_id` on the order.
5. Elasticsearch analyzer diagnostic (B2.1) when an ES host exists; until then Branch B middleware stays.
6. Set `TRUTH_TTL_MS` from measured Magento p95 (rehearsal default `120000` in `env.example`).
7. Optional Pinecone: upsert **copy-only** vectors per `store_code` (never price/stock), then set `PINECONE_API_KEY` + `PINECONE_INDEX_HOST`.
8. Grow the golden set toward 150–300 real Midas utterances.

## Later (not this slice)

- SSE token streaming, WhatsApp/Meta
- 3D / AR, Wallet live balance, seven-mode search experience, a live multi-agent tree
- JSON-LD on live Magento PDPs (mirror PDPs already have it)
- LLM-as-judge (the deterministic judge is live; a model judge waits on bake-off)

## Owner split

- **Marketing:** Part A stays frozen except via this combined spec; edit `knowledge/<country>/*.md` for care copy. Review `/insights` — do not paste clusters into the KB without a human pass.
- **Engineering:** Magento GraphQL + verifier + retrieval layers in B2–B4.
