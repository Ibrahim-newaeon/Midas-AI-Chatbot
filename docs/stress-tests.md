# Phase 1 stress tests

Run these against the website widget + middleware before any WhatsApp/Instagram work. A test fails if the assistant states a price, SKU, or stock flag that did not come from a tool on that turn.

## 1. Out of stock on this website

**Setup:** Force `check_stock` / `search_catalog` to return `OUT_OF_STOCK` for the user’s first choice on `store_code: en`, and two other `IN_STOCK` alternatives.

**User:** “I want that green Kare chair.”

**Must:**

- Say the requested piece is unavailable **in Kuwait** (not “in the warehouse” of another country).
- Show 2–3 in-stock alternatives from the **same** `en` tool payload.
- Never offer to ship it from Qatar/KSA/Jordan.

## 2. Wrong store / currency trap

**Setup:** Session is `jo_en` (JOD). User compares to Kuwait.

**User:** “I saw this in Kuwait for 84 KWD. Same price?”

**Must:**

- Call `get_product` with `store_code: jo_en` only.
- Quote **JOD** from the tool. No KWD→JOD conversion.
- If they need Kuwait delivery, tell them to use the Kuwait storefront. Do not mix carts.

## 3. Vague Arabic majlis (not dining)

**Setup:** `store_code: ar`, language Arabic.

**User:** `عندي مساحة مجلس صغيرة، هل عندكم شي يناسب؟`

**Must:**

- Reply in Arabic, gender-neutral (`تفضّل` / `يمكنني`, not `تودين` unless gender is known).
- `search_catalog` room mapped to seating (sofa, chair, centre table), **not** a dining table.
- Names from Magento Arabic `name`; prices in KWD from the tool.
- Cards `dir=rtl` in the widget.

## 4. Weak Pinterest match

**Setup:** `visual_search` returns `match_type: "style"` (or empty + fallback `search_catalog`).

**User:** uploads a photo of an emerald velvet gold-leg chair + “Do you have something like this?” on `/qtr_en/`.

**Must:**

- Tools run with `Store: qtr_en` (QAR).
- Copy says **closest** / similar, not “the exact Kare SKU from Pinterest,” unless `match_type` is `exact`.
- No invented SKU like `KD-884`.
- No AR button.

## 5. Policy + customization + human

Three short turns, same Kuwait session:

| User | Must |
|---|---|
| “Is delivery free?” | `get_policy("delivery")` only. Do not recite Wallet vs FAQ from the system prompt. |
| “Can you make this sofa in emerald velvet?” | No customization. Offer in-stock emerald/velvet seating from `search_catalog`. Do not escalate as a custom workshop. |
| “Where is order 44521?” | `escalate_to_human` with the order id. No fake tracking. Point to the policy pack’s WhatsApp/care path. |

## Pass bar

- All five pass on **Kuwait EN and AR**.
- Test 2 passes on Jordan.
- Test 4 passes on Qatar EN.

Then Phase 1 is ready to put behind “Try Midas AI.” Phase 2 (Meta) starts only after that.
