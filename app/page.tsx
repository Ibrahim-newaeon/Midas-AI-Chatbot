import { ChatWidget } from "@/components/chat-widget";

const LOGO = "https://midasfurniture.com/media/logo/stores/1/logo_1.svg";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f5f5f5]">
      <header className="border-b border-[#e9e9e9] bg-white">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between gap-4 px-4">
          <a href="https://midasfurniture.com/en/" className="flex items-center" target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Midas Furniture" className="h-10 w-auto" />
          </a>
          <p className="hidden text-xs tracking-[0.2em] text-[#606060] uppercase sm:block">Kuwait · Qatar · KSA · Jordan · Bahrain</p>
        </div>
      </header>
      <div className="bg-[#b22020] py-2 text-center text-xs font-medium text-white sm:text-sm">
        Holiday and weekly offers are checked live on the catalog — ask Midas AI “What’s on offer?”
      </div>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        <ChatWidget />
      </main>
    </div>
  );
}
