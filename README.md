# Midas AI — Website Phase 1

This repo holds the **website-only** system prompt for Midas AI, the virtual shopping assistant for [midasfurniture.com](https://midasfurniture.com/) and the GCC store views (Kuwait, Qatar, KSA, Jordan, Bahrain — English and Arabic).

It is **not** a WhatsApp or Instagram bot. Meta channels are Phase 2 and must not be loaded into this prompt.

## What this prompt is for

Paste or load [`prompts/midas-ai-website-system.md`](prompts/midas-ai-website-system.md) as the model’s system instructions for the Magento website widget.

The orchestrator must also inject a **session object** every turn (`store_code`, currency, language, `base_path`, optional `page_sku`). The model is forbidden to quote prices until that is set.

## Design choices (locked)

| Decision | Why |
|---|---|
| One Magento, ten store views | Live GraphQL already scopes price, language, and stock via the `Store` header (`en`, `ar`, `qtr_en`, `ksa_ar`, …). |
| Tools, not a frozen catalog | SKUs, KD-style fake IDs, sale %, and delivery rules go stale and cause hallucinations. |
| Vision → Magento search | Phase 1 `visual_search` describes the photo, then searches this store. No Pinecone/AR required to launch. |
| Arabic hospitality, gender-neutral | Majlis maps to seating, not dining. No `تودين` unless gender is known. |
| No cross-country stock | Out of stock locally → alternatives on the **same** website. |
| No customization | Ready-made factory pieces only. |
| Cards from tool results only | The widget must not render a price the model invented. |

## Store map

| Store code | Site | Currency | Path |
|---|---|---|---|
| `en` / `ar` | Kuwait | KWD | `/en/`, `/ar/` |
| `qtr_en` / `qtr_ar` | Qatar | QAR | `/qtr_en/`, `/qtr_ar/` |
| `ksa_en` / `ksa_ar` | KSA | SAR | `/ksa_en/`, `/ksa_ar/` |
| `jo_en` / `jo_ar` | Jordan | JOD | `/jo_en/`, `/jo_ar/` |
| `bhr_en` / `bhr_ar` | Bahrain | BHD | `/bhr_en/`, `/bhr_ar/` |

Catalog API (already public): `POST https://midasfurniture.com/graphql` with header `Store: <store_code>`.

## What was removed from the original Mega prompt

- WhatsApp and Instagram formatters, Meta fees, BSP/webhook architecture
- SaaS pricing tables and token commercial packaging
- Hardcoded 15–35% promotions and “KWD 15 delivery saving”
- 3D/AR CTAs as a default
- Custom-fabric human escalation
- Cross-border warehouse shipping
- Invented SKUs (`KD-884`, `AS-221`)
- Vector DB and Wallet live math as launch blockers

## How to run the model

1. System: this prompt (cache it; it is static).
2. Session JSON from the Magento page — see [docs/session-injection.md](docs/session-injection.md) and [`widget/resolve-session.js`](widget/resolve-session.js).
3. User: text and optional image.
4. Tools: Magento GraphQL behind middleware (`search_catalog`, `visual_search`, `get_product`, `check_stock`, `get_policy`, …).
5. Assistant: `message` + `ui.products` copied from tool JSON.

## Next build step (not in this repo yet)

Middleware that translates tool JSON → Magento GraphQL, plus a Magento widget that sends `store_code` and renders product cards (`view`, `add_to_cart`, `handoff` only).
