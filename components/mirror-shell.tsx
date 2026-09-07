import type { ReactNode } from "react";
import { ChatWidget } from "@/components/chat-widget";
import {
  COUNTRY_EN_STORE,
  PAIR_STORE,
  STORE_LABELS,
  WEBSITE_NAME,
  sessionFromStoreCode,
  type StoreCode,
  type WebsiteId,
} from "@/lib/stores";

const LOGO = "https://midasfurniture.com/media/logo/stores/1/logo_1.svg";
const WEBSITES: WebsiteId[] = ["kuwait", "qatar", "ksa", "jordan", "bahrain"];

function storeForCountry(website: WebsiteId, lang: "en" | "ar"): StoreCode {
  const en = COUNTRY_EN_STORE[website];
  return lang === "ar" ? PAIR_STORE[en] : en;
}

export function MirrorShell({
  store,
  children,
}: {
  store: StoreCode;
  children: ReactNode;
}) {
  const session = sessionFromStoreCode(store, { catalog: "mirror" });
  const ar = session.language === "ar";
  const country = WEBSITE_NAME[session.website][ar ? "ar" : "en"];
  const alt = PAIR_STORE[store];

  return (
    <div dir={ar ? "rtl" : "ltr"} lang={ar ? "ar" : "en"} className="flex min-h-full flex-1 flex-col bg-page">
      <script
        dangerouslySetInnerHTML={{
          __html: `var BASE_URL=${JSON.stringify(session.base_path)};var LOCALE=${JSON.stringify(ar ? "ar_SA" : "en_US")};`,
        }}
      />
      <div className="bg-ink py-1.5 text-center text-[11px] font-semibold tracking-[0.03em] text-on-ink uppercase">
        {ar ? "متجر تجريبي — ليس الدفع الحي لميداس" : "Demo Magento mirror — not live Midas checkout"}
      </div>
      <header className="border-b border-line bg-page">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-4">
          <a href={`/${store}/`} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Midas Furniture" className="h-11 w-auto" />
          </a>
          <nav className="hidden items-center gap-6 text-[12px] font-semibold tracking-[0.03em] text-ink uppercase md:flex">
            <a href={`/${store}/living`}>{ar ? "المعيشة" : "Living"}</a>
            <a href={`/${store}/dining`}>{ar ? "السفرة" : "Dining"}</a>
            <a href={`/${store}/bedrooms`}>{ar ? "غرف النوم" : "Bedrooms"}</a>
            <a href={`/${store}/offers`} className="text-accent-red">
              {ar ? "عروض" : "Offers"}
            </a>
          </nav>
          <div className="flex items-center gap-2 text-[12px]">
            <a href={`/${alt}/`} className="underline">
              {ar ? "English" : "العربية"}
            </a>
            <a href={`/${store}/cart`} className="font-semibold">
              {ar ? "السلة" : "Cart"}
            </a>
          </div>
        </div>
      </header>
      <div className="border-b border-line bg-surface-off">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-[12px]">
          <span className="text-text-muted">{ar ? "الدولة" : "Country"}</span>
          {WEBSITES.map((website) => {
            const href = `/${storeForCountry(website, session.language)}/`;
            const active = session.website === website;
            return (
              <a
                key={website}
                href={href}
                className={`rounded-[30px] border px-3 py-1 ${active ? "border-ink bg-ink text-on-ink" : "border-line"}`}
              >
                {WEBSITE_NAME[website][ar ? "ar" : "en"]}
              </a>
            );
          })}
          <span className="ms-auto text-text-muted">
            {STORE_LABELS[store]} · {session.currency} · {country}
          </span>
        </div>
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-4 pb-2 text-[12px] font-semibold uppercase md:hidden">
          <a href={`/${store}/living`}>{ar ? "المعيشة" : "Living"}</a>
          <a href={`/${store}/dining`}>{ar ? "السفرة" : "Dining"}</a>
          <a href={`/${store}/bedrooms`}>{ar ? "النوم" : "Bedrooms"}</a>
          <a href={`/${store}/offers`} className="text-accent-red">
            {ar ? "عروض" : "Offers"}
          </a>
        </div>
      </div>
      <div className="bg-accent-red py-2.5 text-center text-[14px] font-semibold text-on-ink">
        {ar
          ? "أسعار تجريبية حسب الدولة — اسأل ميداس AI عن العروض أو الصق رابط المنتج"
          : "Demo prices per country — ask Midas AI what’s on offer, or paste a product link"}
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6">
        {children}
        <section data-testid="midas-ai-widget">
          <ChatWidget lockedStore={store} catalog="mirror" />
        </section>
      </main>
      <footer className="border-t border-line py-4 text-center text-[12px] text-text-muted">
        <a href="/demo" className="underline">
          {ar ? "كل متاجر المرآة" : "All mirror stores"}
        </a>
        {" · "}
        <a href="/" className="underline">
          {ar ? "المساعد على الكتالوج الحي" : "Live Magento assistant"}
        </a>
      </footer>
    </div>
  );
}
