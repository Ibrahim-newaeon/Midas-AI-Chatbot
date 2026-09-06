"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { STORE_CODES, STORE_LABELS, sessionFromStoreCode, type StoreCode } from "@/lib/stores";
import type { AssistantTurn, ChatMessage, ProductDto } from "@/lib/types";

type Bubble = ChatMessage & {
  ui?: AssistantTurn["ui"];
  imagePreview?: string;
};

const SUGGESTIONS: Record<"en" | "ar", string[]> = {
  en: ["What's on offer?", "Where is the Al Rai showroom?", "I have a complaint about my order", "Is delivery free?"],
  ar: ["شنو العروض الحالية؟", "وين معرض الري؟", "عندي شكوى عن الطلب", "هل التوصيل مجاني؟"],
};

function formatPrice(product: ProductDto, ar: boolean) {
  const n = product.final_price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const was = product.regular_price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const cur = ar
    ? { KWD: "د.ك", QAR: "ر.ق", SAR: "ر.س", JOD: "د.أ", BHD: "د.ب" }[product.currency]
    : product.currency;
  return { n, was, cur, onSale: product.final_price < product.regular_price };
}

function ProductCard({ product, ar }: { product: ProductDto & { title?: string }; ar: boolean }) {
  const price = formatPrice(product, ar);
  const title = product.title ?? product.name;
  return (
    <article className="overflow-hidden border border-[#e9e9e9] bg-white">
      <a href={product.pdp_url} target="_blank" rel="noreferrer" className="block">
        <div className="relative aspect-square bg-[#f7f7f7]">
          {product.discount_percent ? (
            <span className="absolute start-0 top-0 z-10 bg-[#b22020] px-2 py-1 text-[11px] font-semibold text-white">
              {product.discount_percent}%
            </span>
          ) : null}
          {product.image_url ? (
            // Magento URLs include query params; native img is more reliable here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={title} className="h-full w-full object-contain p-3" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#606060]">No image</div>
          )}
        </div>
        <div className="space-y-2 p-3 text-center">
          {product.brand ? (
            <p className="text-[10px] tracking-[0.16em] text-[#606060] uppercase">{product.brand}</p>
          ) : null}
          <p className="min-h-10 text-sm leading-snug font-medium text-[#121111]">{title}</p>
          <div className="space-y-0.5">
            {price.onSale ? (
              <p className="text-[11px] text-[#8a8a8a] line-through">
                {ar ? "السعر السابق" : "Regular Price"} {price.was} {price.cur}
              </p>
            ) : null}
            <p className="text-sm font-semibold text-[#121111]">
              {price.onSale ? (ar ? "سعر خاص" : "Special Price") : null} {price.n} {price.cur}
            </p>
          </div>
        </div>
      </a>
      <a
        href={product.pdp_url}
        target="_blank"
        rel="noreferrer"
        className="block bg-[#121111] py-2.5 text-center text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
      >
        {ar ? "عرض المنتج" : "View product"}
      </a>
    </article>
  );
}

export function ChatWidget() {
  const [store, setStore] = useState<StoreCode>("en");
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const messagesRef = useRef<Bubble[]>([]);

  const session = useMemo(() => sessionFromStoreCode(store), [store]);
  const ar = session.language === "ar";
  const dir = ar ? "rtl" : "ltr";

  useEffect(() => {
    let cancelled = false;
    setFeatured([]);
    fetch(`/api/offers?store=${store}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.ok) setFeatured(json.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeatured([]);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  async function send(text: string, dataUrl = image) {
    const content = text.trim();
    if (!content && !dataUrl) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    setError(null);
    setPending(true);
    const userBubble: Bubble = {
      role: "user",
      content: content || (ar ? "صورة للبحث" : "Photo search"),
      imagePreview: dataUrl ?? undefined,
    };
    const nextMessages = [...messagesRef.current, userBubble];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setInput("");
    setImage(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          image_data_url: dataUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || "Chat failed");
      }
      const assistant: Bubble = {
        role: "assistant",
        content: json.message as string,
        ui: json.ui as AssistantTurn["ui"],
      };
      const withReply = [...messagesRef.current, assistant];
      messagesRef.current = withReply;
      setMessages(withReply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div
      dir={dir}
      className="flex min-h-[min(760px,calc(100dvh-8rem))] flex-col overflow-hidden border-x-0 border-y border-[#e9e9e9] bg-white sm:border"
    >
      <header className="flex flex-col gap-3 border-b border-[#e9e9e9] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-[#121111]">Midas AI</p>
          <p className="text-xs text-[#606060]">
            {ar
              ? "مساعد التسوق الرسمي — أسعار ومخزون هذا المتجر فقط"
              : "Official shopping assistant — this store’s live catalog"}
          </p>
        </div>
        <label className="text-xs">
          <span className="mb-1 block tracking-[0.12em] text-[#606060] uppercase">{ar ? "المتجر" : "Store"}</span>
          <select
            className="h-9 min-w-48 border border-[#d9d9d9] bg-white px-2 text-sm text-[#121111]"
            value={store}
            onChange={(e) => {
              setStore(e.target.value as StoreCode);
              messagesRef.current = [];
              setMessages([]);
            }}
          >
            {STORE_CODES.map((code) => (
              <option key={code} value={code}>
                {STORE_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2 text-center">
                <p className="font-heading text-2xl text-[#121111] sm:text-3xl">
                  {ar ? "لا تتنازل، أنت تستحق الأفضل" : "Don't compromise, you deserve the finest"}
                </p>
                <p className="mx-auto max-w-xl text-sm text-[#606060]">
                  {ar
                    ? "اسأل عن العروض الحالية من فئات التخفيض في ماجنتو، أو غرفة، أو أرفق صورة."
                    : "Ask about current Magento sale categories, a room, or attach a photo. Prices follow the country you select."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS[ar ? "ar" : "en"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    className="border border-[#121111] px-3 py-1.5 text-xs tracking-[0.08em] text-[#121111] uppercase hover:bg-[#121111] hover:text-white disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void send(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {featured.length ? (
                <div className="space-y-3">
                  <p className="text-center text-[11px] tracking-[0.2em] text-[#b22020] uppercase">
                    {ar ? "عروض حية من الكتالوج" : "Live from this store’s sale categories"}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {featured.map((p) => (
                      <ProductCard key={p.sku} product={p} ar={ar} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div key={`${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[min(100%,40rem)] space-y-3 ${m.role === "user" ? "text-end" : ""}`}>
                <div
                  className={`px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-[#121111] text-white" : "bg-[#f5f5f5] text-[#121111]"
                  }`}
                >
                  {m.imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imagePreview} alt="" className="mb-2 max-h-40 object-cover" />
                  ) : null}
                  {m.content}
                </div>
                {m.ui?.products?.length ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {m.ui.products.map((p) => (
                      <ProductCard key={p.sku} product={p} ar={ar} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {pending ? (
            <div className="flex items-center gap-2 text-sm text-[#606060]">
              <Loader2 className="size-4 animate-spin" />
              {ar ? "أبحث في كتالوج هذا المتجر…" : "Searching this store’s catalog…"}
            </div>
          ) : null}
          {error ? <p className="text-sm text-[#b22020]">{error}</p> : null}
        </div>
      </ScrollArea>

      <form
        className="border-t border-[#e9e9e9] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        {image ? (
          <div className="mb-2 flex items-center gap-2 text-xs text-[#606060]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-12 w-12 object-cover" />
            <button type="button" className="underline" onClick={() => setImage(null)}>
              {ar ? "إزالة الصورة" : "Remove photo"}
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-none border-[#d9d9d9]"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload"
          >
            <ImagePlus className="size-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ar ? "اسأل عن غرفة، مقاس، أو أرفق صورة…" : "Ask about a room, size, or attach a photo…"}
            className="min-h-11 max-h-32 flex-1 resize-none rounded-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={pending} className="rounded-none bg-[#121111]" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
