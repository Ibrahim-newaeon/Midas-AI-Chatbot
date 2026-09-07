# Todo — gaps vs Phase 1 website system prompt

Source: Ibrahim’s Phase 1 TextEdit prompt (`# Midas AI — Website System Prompt (Phase 1)`).  
Runtime copy: `prompts/midas-ai-website-system.md`.  
Status legend matches the README: **Not started** / **Partial** / **Waiting on live**.

Consider **all** of these. Do not drop a line because it is “later” — it stays on the list until it is Done or explicitly out of scope.

---

## Catalog truth

- [ ] **Magento colour / material / dimensions on `get_product`.** Resolve option IDs via `customAttributeMetadata` (see `docs/middleware-api.md`). Stop sending `null` for `color`, `material`, `dimensions` when Magento has labels. Spoken size/material must copy this turn’s tool fields.
- [ ] **`search_catalog` `style` filter.** The Phase 1 JSON includes `style` (e.g. modern). Add it to the search input and retrieval (text and/or Magento attribute), not name-guess only.
- [ ] **Magento-backed colour / material filters.** Today colour and material are keyword-in-name. Prefer Magento filters when the option map exists; keep text match as fallback.

## Shopper flows

- [ ] **PDP `page_sku` → this piece, then complements.** After `get_product(page_sku)`, run `search_catalog` for one rug / lighting / side table on **this** store. Do not invent pairings from memory.
- [ ] **Out of stock → 2–3 in-stock alternatives.** Same store, similar style and budget when possible. A named OOS SKU must not be the only card.
- [ ] **Vague ask → one clarifying question.** If there is no room, size, budget, or style yet, ask **one** question. If they already sent a photo, recommend first, then ask.
- [ ] **Photo / Pinterest structured vision.** Vision should return `{ category, colours, materials, style, room }` (majlis → seating), then search this store. Set `match_type` to `exact` | `close` | `style` honestly. Do not always force `style`. Vision still needs `OPENAI_API_KEY`; caption-only remains the fallback.

## Account and cart

- [ ] **`get_wallet_status` when `customer_logged_in`.** Logged-in only. On failure, skip Wallet personalization; do not invent points or “you save 15 KWD.” Policy copy stays for guests.
- [ ] **Real Magento `add_to_cart`.** Theme must handle `midas:add_to_cart` / cart token. Preview may still open the PDP until that hook exists. **Waiting on live.**

## Handoff and policy

- [ ] **`escalate_to_human` agent packet.** `reason` + one-paragraph `summary` + `order_id` when present. Widget handoff flag is not enough.
- [ ] **Installation as its own `get_policy("installation")` topic.** Do not fold “تركيب / installation” only into delivery.

## Merchandising context

- [ ] **Shop by residence / life-milestone journeys.** Use as merchandising context from Magento or knowledge — not invented packages.

## Already extra vs that prompt (keep; not gaps)

Paste a PDP URL, Arabizi, don’t “correct” Arabic spelling, injection / 90% off, last-three-SKU follow-ups, UTM on product links.

## Go-live (unchanged, still on the list)

- [ ] Widget script on midasfurniture.com (`/widget/midas-ai.js`).
- [ ] Confirm store / language / currency / `page_sku` on a real Magento PDP.
- [ ] Thank-you GTM + `chat_session_id` on the order (optional).
- [ ] JSON-LD on live Magento PDPs.
- [ ] `TRUTH_TTL_MS` from measured Magento p95.
- [ ] Pinecone copy-only index when keys exist.
- [ ] Grow golden eval toward live transcripts.
