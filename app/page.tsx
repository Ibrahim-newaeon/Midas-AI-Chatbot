import { ChatWidget } from "@/components/chat-widget";

const LOGO = "https://midasfurniture.com/media/logo/stores/1/logo_1.svg";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <div className="bg-[#121111] py-1.5 text-center text-[11px] tracking-[0.18em] text-white uppercase">
        Midas Furniture · Kuwait · Qatar · KSA · Jordan · Bahrain
      </div>
      <header className="border-b border-[#e9e9e9] bg-white">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-4">
          <a href="https://midasfurniture.com/en/" className="flex items-center" target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Midas Furniture" className="h-11 w-auto" />
          </a>
          <nav className="hidden items-center gap-6 text-[11px] font-medium tracking-[0.16em] text-[#121111] uppercase md:flex">
            <span>Living</span>
            <span>Dining</span>
            <span>Bedrooms</span>
            <span className="text-[#b22020]">Offers</span>
          </nav>
        </div>
      </header>
      <div className="bg-[#b22020] py-2.5 text-center text-xs font-medium text-white sm:text-sm">
        Holiday Sale is Here — live Magento prices. Ask Midas AI “What’s on offer?”
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-0 sm:px-4 sm:py-6">
        <ChatWidget />
      </main>
    </div>
  );
}
