# How to build and inject the Magento session JSON

The model must not guess country, language, or currency. The **website widget** reads Magento, builds a small JSON object, and the **orchestrator** prepends that object to every LLM turn.

Midas already has **store codes in the URL** (`/en/`, `/ksa_en/`, `/qtr_ar/`, …). That is the source of truth. The Magento `store` cookie is only a fallback.

## 1. What you are collecting

```json
{
  "store_code": "ksa_en",
  "website": "ksa",
  "locale": "en",
  "language": "en",
  "currency": "SAR",
  "base_path": "/ksa_en/",
  "page_sku": null,
  "customer_logged_in": false,
  "channel": "web"
}
```

| Field | Where it comes from |
|---|---|
| `store_code` | First path segment of Magento `BASE_URL` or `location.pathname`, else cookie `store` |
| `website`, `currency`, `language`, `base_path` | Lookup table from `store_code` (not from Magento HTML) |
| `page_sku` | PDP only: `[data-product-sku]` |
| `customer_logged_in` | Magento `mage-cache-storage` customer section, or `customer-logged-in` on `<body>` |
| `channel` | Always `"web"` in Phase 1 |

Do **not** treat `PHPSESSID` as a store code. That cookie is the PHP session, not Kuwait vs KSA.

## 2. Read it on the Magento page (widget JS)

Every Midas HTML page already prints:

```js
var LOCALE = 'en-US';
var BASE_URL = 'https://midasfurniture.com/en/';
```

On KSA English it is `https://midasfurniture.com/ksa_en/`. Parse the path of `BASE_URL` first. It stays correct even if the customer opened a relative link.

Then:

```js
import { resolveMidasSession } from "./resolve-session.js";

const session = resolveMidasSession();
// send `session` with every chat request
```

Priority inside `resolveMidasSession()`:

1. `window.BASE_URL` path (`/ksa_en/` → `ksa_en`)
2. `window.location.pathname` first segment
3. Magento cookie named `store` (set after a store-switcher click)

If the URL says Qatar and the cookie still says `en`, **trust the URL**. With “Add Store Code to URLs” on, Magento is serving the Qatar catalog.

### Optional: Magento `store` cookie

After the customer uses the country/language switcher, Magento may set:

```http
Cookie: store=ksa_en
```

Use it only when the path is `/` or the first segment is not a known store code.

### Product page SKU

On a PDP, Magento marks the page `catalog-product-view` and outputs `data-product-sku="167848"`. Read that into `page_sku` so the assistant calls `get_product` for the piece they are looking at. On CMS/category pages leave it `null`.

### Logged-in customer

Magento private content lives in `localStorage["mage-cache-storage"]`:

```js
JSON.parse(localStorage.getItem("mage-cache-storage")).customer
```

If `firstname`, `fullname`, or `email` is present, set `customer_logged_in: true`. Only then may the backend call `get_wallet_status` (with the Magento customer cookie forwarded, not with the LLM).

## 3. Send it to your backend (not to Magento GraphQL as the prompt)

Every widget `POST /chat` (your orchestrator) should look like:

```http
POST /chat HTTP/1.1
Content-Type: application/json

{
  "session": {
    "store_code": "ksa_en",
    "website": "ksa",
    "locale": "en",
    "language": "en",
    "currency": "SAR",
    "base_path": "/ksa_en/",
    "page_sku": null,
    "customer_logged_in": false,
    "channel": "web"
  },
  "messages": [
    { "role": "user", "content": "Do you have something like this?" }
  ],
  "image_ref": null
}
```

Validate `store_code` on the server against the allow-list (`en`, `ar`, `qtr_en`, …). Do not let the browser invent `region: "KSA"` without a store view.

## 4. Inject it into the model (orchestrator)

Keep the long website prompt as a **cached system** message. Put session JSON in a **second, short system (or developer) message** so it can change when they switch country without busting the prompt cache.

```js
const llmMessages = [
  { role: "system", content: WEBSITE_SYSTEM_PROMPT },
  {
    role: "system",
    content: "SESSION_CONTEXT (ground truth for this turn):\n" + JSON.stringify(session),
  },
  ...history,
  { role: "user", content: userTurn },
];
```

Every Magento GraphQL tool call then sends:

```http
POST https://midasfurniture.com/graphql
Store: ksa_en
Content-Type: application/json
```

`Store` must equal `session.store_code`. That is how prices become SAR and names stay English on `/ksa_en/`.

## 5. When they switch store mid-chat

The Magento store switcher reloads the page (`/en/` → `/qtr_ar/`). On reload, resolve session again. Start a **new** chat session or append a system note that `store_code` changed, and never reuse the previous turn’s KWD prices.

## 6. If `store_code` cannot be resolved

The prompt already says: ask which country, and do not quote prices. The widget should still send `store_code: null` rather than defaulting to Kuwait.

## 7. Magento theme embed

Drop this on the Magento theme (after `var BASE_URL`):

```html
<script src="https://YOUR_MIDAS_AI_HOST/widget/midas-ai.js" async></script>
```

The script resolves session the same way as `resolveMidasSession()`, then iframes `/embed?store=<code>`. Listen for `message` events with `type: "midas:add_to_cart"` if you want the tap to hit the real Magento cart.
