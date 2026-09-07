import { COUNTRY_EN_STORE, PAIR_STORE, WEBSITE_NAME, type WebsiteId } from "@/lib/stores";

const WEBSITES: WebsiteId[] = ["kuwait", "qatar", "ksa", "jordan", "bahrain"];

export default function DemoHub() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="text-[13px] text-text-muted">
        <a className="underline" href="/brief">
          Client brief
        </a>
        {" · "}
        <a className="underline" href="/">
          Kuwait live catalog
        </a>
      </p>
      <p className="font-display text-[36px] leading-tight text-ink">Magento mirror</p>
      <p className="text-[15px] text-text-muted">
        A rehearsal storefront for Midas AI. English and Arabic homes per country, with eight Living, Dining,
        and Bedroom pieces plus eight Offers. Catalog, prices, and cart are fixtures — not live Midas checkout.
        The assistant on <code>/</code> still talks to real Magento.
      </p>
      <ul className="space-y-4">
        {WEBSITES.map((website) => {
          const en = COUNTRY_EN_STORE[website];
          const ar = PAIR_STORE[en];
          return (
            <li key={website} className="midas-card p-4">
              <p className="font-semibold">{WEBSITE_NAME[website].en}</p>
              <div className="mt-2 flex gap-4 text-[14px]">
                <a className="underline" href={`/${en}/`}>
                  English · {en}
                </a>
                <a className="underline" href={`/${ar}/`}>
                  العربية · {ar}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-text-muted">
        Ten storefronts (5 countries × English/Arabic). Each home lists eight products per department.{" "}
        <a className="underline" href="/insights">
          Asked-but-not-stocked insight
        </a>
        .
      </p>
    </div>
  );
}
