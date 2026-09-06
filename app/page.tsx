import { ChatWidget } from "@/components/chat-widget";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
        <header className="space-y-2">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Midas Furniture · GCC</p>
          <h1 className="font-[family-name:var(--font-serif)] text-4xl leading-tight sm:text-5xl">
            Midas AI website assistant
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Phase 1 widget: live Magento prices and stock for Kuwait, Qatar, KSA, Jordan, and Bahrain.
            Switch the store to change currency and language. Product cards open the real Midas PDP.
          </p>
        </header>
        <ChatWidget />
        <p className="text-center text-xs text-muted-foreground">
          WhatsApp and Instagram are Phase 2. This chat never invents SKUs — it queries midasfurniture.com/graphql.
        </p>
      </div>
    </div>
  );
}
