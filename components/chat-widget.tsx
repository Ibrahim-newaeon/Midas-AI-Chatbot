"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { STORE_CODES, STORE_LABELS, sessionFromStoreCode, type StoreCode } from "@/lib/stores";
import type { AssistantTurn, ChatMessage, ProductDto } from "@/lib/types";

type Bubble = ChatMessage & {
  ui?: AssistantTurn["ui"];
  imagePreview?: string;
};

const SUGGESTIONS: Record<"en" | "ar", string[]> = {
  en: [
    "Kare accent chair in gold and green",
    "Sofa for a small majlis",
    "Is delivery free?",
    "Do you customize fabric?",
  ],
  ar: [
    "عندي مساحة مجلس صغيرة، هل عندكم شي يناسب؟",
    "كرسي كاري مخمل",
    "هل التوصيل مجاني؟",
    "تقدرون تفصّلون القماش؟",
  ],
};

function formatPrice(product: ProductDto, ar: boolean) {
  const n = product.final_price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const was = product.regular_price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const cur = ar
    ? { KWD: "د.ك", QAR: "ر.ق", SAR: "ر.س", JOD: "د.أ", BHD: "د.ب" }[product.currency]
    : product.currency;
  return { n, was, cur, onSale: product.final_price < product.regular_price };
}

function ProductCard({ product, ar }: { product: ProductDto & { title: string }; ar: boolean }) {
  const price = formatPrice(product, ar);
  return (
    <Card className="overflow-hidden border-border/80 py-0 shadow-none">
      <a href={product.pdp_url} target="_blank" rel="noreferrer" className="block">
        <div className="aspect-[4/3] bg-muted">
          {product.image_url ? (
            // Magento URLs include query params; native img is more reliable here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </div>
        <div className="space-y-2 p-3">
          {product.brand ? (
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{product.brand}</p>
          ) : null}
          <p className="font-medium leading-snug">{product.title}</p>
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-semibold">
              {price.n} {price.cur}
            </span>
            {price.onSale ? (
              <span className="text-muted-foreground line-through">
                {price.was} {price.cur}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={product.stock_status === "IN_STOCK" ? "secondary" : "outline"}>
              {product.stock_status === "IN_STOCK"
                ? ar
                  ? "متوفر"
                  : "In stock"
                : ar
                  ? "غير متوفر"
                  : "Out of stock"}
            </Badge>
            {product.match_type === "style" ? (
              <Badge variant="outline">{ar ? "أقرب نمط" : "Closest style"}</Badge>
            ) : null}
          </div>
        </div>
      </a>
      <div className="flex gap-2 border-t px-3 py-2">
        <a
          href={product.pdp_url}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "sm" }), "flex-1")}
        >
          {ar ? "عرض المنتج" : "View on Midas"}
        </a>
      </div>
    </Card>
  );
}

export function ChatWidget() {
  const [store, setStore] = useState<StoreCode>("en");
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const messagesRef = useRef<Bubble[]>([]);

  const session = useMemo(() => sessionFromStoreCode(store), [store]);
  const ar = session.language === "ar";
  const dir = ar ? "rtl" : "ltr";

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
    <div dir={dir} className={`flex min-h-[min(720px,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm ${ar ? "font-[family-name:var(--font-arabic)]" : ""}`}>
      <header className="flex flex-col gap-3 border-b bg-[color-mix(in_oklch,var(--card),var(--accent)_12%)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-[family-name:var(--font-serif)] text-xl tracking-tight">
            <Sparkles className="size-4" />
            Midas AI
          </p>
          <p className="text-xs text-muted-foreground">
            {ar ? "مساعد التسوق — كتالوج ميداس المباشر لهذا المتجر" : "Website assistant — live Magento catalog for this store"}
          </p>
        </div>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">{ar ? "المتجر" : "Store"}</span>
          <select
            className="h-9 rounded-lg border bg-background px-2 text-sm"
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
            <div className="space-y-3 py-6 text-center">
              <p className="font-[family-name:var(--font-serif)] text-2xl">
                {ar ? "من الإلهام إلى القطعة المناسبة" : "From a room idea to the right piece"}
              </p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                {ar
                  ? "أسعار ومخزون هذا المتجر فقط. لا تحويل عملات، ولا تفصيل، ولا شحن بين الدول."
                  : "Prices and stock are for this store view only. No currency conversion, no custom fabrics, no cross-country warehouse transfers."}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {SUGGESTIONS[ar ? "ar" : "en"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
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
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div key={`${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[min(100%,36rem)] space-y-3 ${m.role === "user" ? "text-end" : ""}`}>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {m.imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imagePreview} alt="" className="mb-2 max-h-40 rounded-lg object-cover" />
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {ar ? "أبحث في كتالوج هذا المتجر…" : "Searching this store’s catalog…"}
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </ScrollArea>

      <form
        className="border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        {image ? (
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-12 w-12 rounded object-cover" />
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
          <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} aria-label="Upload">
            <ImagePlus className="size-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ar ? "اسأل عن غرفة، مقاس، أو أرفق صورة…" : "Ask about a room, size, or attach a photo…"}
            className="min-h-11 max-h-32 flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={pending} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
