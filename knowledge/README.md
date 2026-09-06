# Knowledge pack (not Magento)

This folder is what Midas AI uses for **showrooms, opening hours, customer care, complaints, delivery, returns, payments, Wallet, installation, and customization**.

The live website catalog (prices, stock, SKUs) still comes from Magento GraphQL. This folder is the **operations / FAQ layer** marketing can edit without waiting on a Magento page change.

## How to edit

1. Open `knowledge/<country>/en.md` or `ar.md`.
2. Keep the `## topic` headings exactly as they are (`showrooms`, `hours`, `customer_care`, `complaints`, …).
3. Replace the paragraph under the heading. Write the answer you want the chatbot to say — short, factual, country-specific.
4. Restart the app (`npm run dev` or rebuild production). Files are read from disk at runtime.

Do **not** put another country’s phone number in a file. If a number is not published on that country’s store locator or FAQ, say so and point to `customercare@midasfurniture.com` or the store page.

Sources already used here:

- Kuwait FAQ: https://midasfurniture.com/en/faq_kuwait
- Store locators: `/en/kuwait/`, `/qtr_en/qatar/`, `/ksa_en/ksa/`, `/jo_en/jordan/`
- Bahrain locator page was not published at `/bhr_en/bahrain/` when this pack was filled — do not invent a Bahrain hotline.
