import { MidasAiWidget } from "@/components/midas-ai-widget";

const LOGO = "https://midasfurniture.com/media/logo/stores/1/logo_1.svg";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <div className="bg-ink py-1.5 text-center text-[11px] font-semibold tracking-[0.03em] text-on-ink uppercase">
        Midas Furniture · Kuwait · Qatar · KSA · Jordan · Bahrain
      </div>
      <header className="border-b border-line bg-page">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-4">
          <a href="https://midasfurniture.com/en/" className="flex items-center" target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Midas Furniture" className="h-11 w-auto" />
          </a>
          <nav className="hidden items-center gap-6 text-[12px] font-semibold tracking-[0.03em] text-ink uppercase md:flex">
            <span>Living</span>
            <span>Dining</span>
            <span>Bedrooms</span>
            <span className="text-accent-red">Offers</span>
          </nav>
        </div>
      </header>
      <div className="bg-accent-red py-2.5 text-center text-[14px] font-semibold text-on-ink">
        Holiday Sale is Here — live Magento prices. Ask Midas AI “What’s on offer?”
      </div>
      <p className="border-b border-line bg-surface-off py-2 text-center text-[13px]">
        <a href="/demo" className="font-semibold underline">
          Open the Magento mirror
        </a>
        {" — "}
        demo storefronts per country (English + Arabic), fixture catalog, then connect live Magento.
        {" · "}
        <a href="/en/" className="underline">
          Kuwait English demo
        </a>
      </p>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
        <div className="max-w-2xl space-y-3">
          <p className="font-display text-[36px] leading-tight text-ink">Midas AI</p>
          <p className="text-[15px] text-text-muted">
            Official shopping assistant for Midas Furniture. Tap Try Midas AI (bottom corner on desktop, full screen
            on a phone) and ask in English or Arabic. Prices follow the store you pick — never converted.
          </p>
          <p className="text-[14px]">
            <a href="/demo" className="font-semibold underline">
              Open the Magento mirror
            </a>
            {" to rehearse the widget on demo storefronts before it sits on live Magento."}
          </p>
        </div>
      </main>
      <MidasAiWidget />
    </div>
  );
}
