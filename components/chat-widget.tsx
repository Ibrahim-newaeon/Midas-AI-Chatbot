"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { readMirrorCart, writeMirrorCart } from "@/components/mirror-add-to-cart";
import { trackChat } from "@/lib/analytics";
import { fomoLine, pieceHeadline } from "@/lib/productCopy";
import { withMidasAiUtm } from "@/lib/utm";
import { STORE_CODES, STORE_LABELS, WEBSITE_NAME, sessionFromStoreCode, type StoreCode } from "@/lib/stores";
import type { AssistantTurn, ChatMessage, ProductCta, ProductDto } from "@/lib/types";

type Bubble = ChatMessage & {
  ui?: AssistantTurn["ui"];
  imagePreview?: string;
};

const SUGGESTIONS: Record<"en" | "ar", string[]> = {
  en: ["What's on offer?", "Where is the Al Rai showroom?", "I have a complaint about my order", "Is delivery free?"],
  ar: ["شنو العروض الحالية؟", "وين معرض الري؟", "عندي شكوى عن الطلب", "هل التوصيل مجاني؟"],
};

const IMPORT_SUGGESTIONS: Record<"en" | "ar", string[]> = {
  en: ["Show me sofas", "What's in stock?", "I need a dining table", "Something in velvet"],
  ar: ["ورني الكنب", "شنو المتوفر؟", "أحتاج طاولة طعام", "شي مخمل"],
};

function formatPrice(product: ProductDto, ar: boolean) {
  const n = product.final_price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const was = product.regular_price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const cur = ar
    ? { KWD: "د.ك", QAR: "ر.ق", SAR: "ر.س", JOD: "د.أ", BHD: "د.ب" }[product.currency] ?? product.currency
    : product.currency;
  return { n, was, cur, onSale: product.final_price < product.regular_price };
}

function ProductCard({
  product,
  ar,
  country,
  sameOrigin = false,
  onAddToCart,
  channel = "widget",
}: {
  product: ProductDto & { title?: string; ctas?: ProductCta[] };
  ar: boolean;
  country: string;
  sameOrigin?: boolean;
  onAddToCart?: (product: ProductDto) => void;
  channel?: string;
}) {
  const price = formatPrice(product, ar);
  const lang = ar ? "ar" : "en";
  const title = product.title ?? pieceHeadline(product, lang);
  const href = withMidasAiUtm(product.pdp_url, channel);
  const canCart = product.stock_status === "IN_STOCK" && (product.ctas ? product.ctas.includes("add_to_cart") : true);
  const fomo = fomoLine(product, country, lang);
  const extraLink = sameOrigin ? {} : { target: "_blank" as const, rel: "noreferrer" };
  return (
    <article className="midas-card" data-testid={`product-card-${product.sku}`}>
      <a
        href={href}
        {...extraLink}
        className="block"
        onClick={() => trackChat("chat_product_click", { sku: product.sku })}
      >
        <div className="relative aspect-[4/3] max-h-44 bg-surface-muted">
          {product.discount_percent ? (
            <span className="midas-sale-badge absolute start-0 top-0 z-10">{product.discount_percent}%</span>
          ) : null}
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={title} className="h-full w-full object-contain p-3" />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-text-muted">No image</div>
          )}
        </div>
        <div className="space-y-1.5 p-3 text-center">
          {product.brand ? (
            <p className="text-[12px] tracking-[0.03em] text-text-muted uppercase">{product.brand}</p>
          ) : null}
          <p className="text-[15px] leading-snug font-semibold text-ink">{title}</p>
          <p className="text-[13px] font-semibold text-ink" dir="ltr" data-testid="product-sku">
            SKU {product.sku}
          </p>
          <div className="space-y-0.5" dir="ltr">
            {price.onSale ? (
              <p className="text-[12px] text-text-muted line-through">
                {price.was} {price.cur}
              </p>
            ) : null}
            <p className="text-[16px] font-semibold text-ink">
              {price.n} {price.cur}
            </p>
          </div>
        </div>
      </a>
      {fomo ? (
        <p className="px-3 pb-2 text-center text-[12px] leading-snug font-semibold text-accent-red" data-testid="product-fomo">
          {fomo}
        </p>
      ) : null}
      <div className="space-y-2 px-3 pb-3">
        {canCart ? (
          onAddToCart ? (
            <button
              type="button"
              className="midas-btn-pill-ink min-h-14"
              data-testid="product-add-to-cart"
              aria-label={ar ? "أضف إلى السلة" : "Add to cart"}
              onClick={() => onAddToCart(product)}
            >
              {ar ? "أضف إلى السلة" : "Add to cart"}
            </button>
          ) : (
            <a
              href={href}
              {...extraLink}
              className="midas-btn-pill-ink min-h-14"
              data-testid="product-add-to-cart"
              aria-label={ar ? "أضف إلى السلة" : "Add to cart"}
            >
              {ar ? "أضف إلى السلة" : "Add to cart"}
            </a>
          )
        ) : null}
        <a href={href} {...extraLink} className="block min-h-11 py-2 text-center text-[13px] font-semibold text-ink underline">
          {ar ? "عرض المنتج" : "View product"}
        </a>
      </div>
    </article>
  );
}

export function ChatWidget({
  lockedStore,
  pageSku: pageSkuProp = null,
  catalog = "live",
  tenantId = null,
  clientName,
  currency,
  variant = "page",
  onClose,
}: {
  lockedStore?: StoreCode;
  pageSku?: string | null;
  catalog?: "live" | "mirror" | "import";
  tenantId?: string | null;
  clientName?: string;
  currency?: string;
  variant?: "page" | "dock";
  onClose?: () => void;
} = {}) {
  const [store, setStore] = useState<StoreCode>(lockedStore ?? "en");
  const [detectedSku, setDetectedSku] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartNote, setCartNote] = useState<string | null>(null);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(false);
  const messagesRef = useRef<Bubble[]>([]);
  const sentFirst = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dock = variant === "dock";

  const pageSku = pageSkuProp ?? detectedSku;
  const session = useMemo(
    () => sessionFromStoreCode(store, { page_sku: pageSku, catalog, channel: "widget", tenant_id: tenantId }),
    [store, pageSku, catalog, tenantId],
  );
  const ar = session.language === "ar";
  const dir = ar ? "rtl" : "ltr";
  const country = WEBSITE_NAME[session.website][ar ? "ar" : "en"];
  const chatSessionId = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}`,
  );

  useEffect(() => {
    if (lockedStore) setStore(lockedStore);
  }, [lockedStore]);

  useEffect(() => {
    if (pageSkuProp) return;
    const el = document.querySelector("[data-product-sku]");
    const sku = el?.getAttribute("data-product-sku");
    if (sku) setDetectedSku(sku);
  }, [pageSkuProp]);

  useEffect(() => {
    let cancelled = false;
    setFeatured([]);
    fetch(`/api/offers?store=${store}&catalog=${catalog}${tenantId ? `&tenant=${encodeURIComponent(tenantId)}` : ""}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.ok) setFeatured((json.products ?? []).slice(0, dock ? 2 : 3));
      })
      .catch(() => {
        if (!cancelled) setFeatured([]);
      });
    return () => {
      cancelled = true;
    };
  }, [store, catalog, dock, tenantId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  function addToCart(product: ProductDto) {
    trackChat("chat_add_to_cart", { sku: product.sku, store_code: store, chat_session_id: chatSessionId.current });
    if (catalog === "mirror") {
      const items = readMirrorCart(store);
      const hit = items.find((i) => i.sku === product.sku);
      if (hit) hit.qty += 1;
      else items.push({ sku: product.sku, qty: 1 });
      writeMirrorCart(store, items);
      setCartNote(ar ? "أُضيف إلى سلة التجربة (ليست سلة ميداس الحية)." : "Added to the demo cart (not the live Midas cart).");
      return;
    }
    const href = withMidasAiUtm(product.pdp_url, session.channel);
    window.parent?.postMessage(
      { type: "midas:add_to_cart", sku: product.sku, qty: 1, pdp_url: href, store_code: store, tenant_id: tenantId },
      "*",
    );
    window.open(href, "_blank", "noopener");
    if (catalog === "import") {
      setCartNote(
        ar
          ? "فتحنا صفحة المنتج على موقع العميل. السلة الحقيقية تحتاج ربط add-to-cart عندهم."
          : "Opened the product page on the client site. Their theme must listen for add-to-cart to write the real cart.",
      );
    }
  }

  async function send(text: string, dataUrl = image) {
    const content = text.trim();
    if (!content && !dataUrl) return;
    if (pendingRef.current) return;
    pendingRef.current = true;
    setError(null);
    setCartNote(null);
    setPending(true);
    if (!sentFirst.current) {
      sentFirst.current = true;
      trackChat("chat_first_message", { store_code: store, chat_session_id: chatSessionId.current });
    }
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
          session: {
            ...session,
            chat_session_id: chatSessionId.current,
            catalog,
            tenant_id: tenantId,
            page_sku: pageSku,
            channel: "widget",
          },
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
      const skus = assistant.ui?.products?.map((p) => p.sku) ?? [];
      if (skus.length) trackChat("chat_product_shown", { skus, store_code: store });
      if (assistant.ui?.handoff?.show) trackChat("chat_handoff_human", { reason: assistant.ui.handoff.reason });
      if (json.gate) trackChat("chat_unanswered", { reason: json.gate });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      trackChat("chat_unanswered", { reason: "request_failed" });
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
      className={`flex flex-col overflow-hidden bg-page ${
        dock
          ? "h-full min-h-0"
          : "min-h-[min(760px,calc(100dvh-8rem))] border-x-0 border-y border-line sm:rounded-[10px] sm:border"
      }`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-page px-4 py-3">
        <div className="min-w-0">
          <p className="text-[18px] font-semibold text-ink sm:text-[21px]">Midas AI</p>
          <p className="truncate text-[11px] text-text-muted sm:text-[12px]">
            {ar
              ? catalog === "import"
                ? clientName
                  ? `مساعد التسوق — ${clientName}`
                  : "مساعد التسوق — كتالوج العميل المستورد"
                : catalog === "mirror"
                  ? "مساعد التسوق — كتالوج المرآة لهذه الدولة فقط"
                  : "مساعد التسوق الرسمي — أسعار ومخزون هذا المتجر فقط"
              : catalog === "import"
                ? clientName
                  ? `Shopping assistant for ${clientName}`
                  : "Shopping assistant — this client’s imported catalog"
                : catalog === "mirror"
                  ? "Shopping assistant — this country’s demo catalog only"
                  : "Official shopping assistant — this store’s live catalog"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {catalog === "import" ? (
            <p className="shrink-0 text-[11px] font-semibold text-ink sm:text-[12px]">
              {currency ?? (ar ? "كتالوج مستورد" : "Imported catalog")}
            </p>
          ) : lockedStore ? (
            <p className="shrink-0 text-[11px] font-semibold text-ink sm:text-[12px]">{STORE_LABELS[store]}</p>
          ) : (
            <label className="shrink-0 text-[12px]">
              <span className="sr-only">{ar ? "المتجر" : "Store"}</span>
              <select
                className="midas-input h-11 min-w-36 px-3 text-[12px]"
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
          )}
          {onClose ? (
            <button
              type="button"
              className="flex size-14 shrink-0 items-center justify-center text-ink"
              data-testid="midas-ai-close"
              aria-label={ar ? "إغلاق" : "Close chat"}
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1 bg-page">
        <div className="space-y-4 p-3 sm:p-4">
          {messages.length === 0 ? (
            <div className="space-y-5 py-2">
              <div className="space-y-2 text-center">
                <p className={`font-display leading-tight text-ink ${dock ? "text-[22px]" : "text-[30px]"}`}>
                  {catalog === "import"
                    ? ar
                      ? "ما الذي تبحث عنه؟"
                      : "What are you furnishing?"
                    : ar
                      ? "لا تتنازل، أنت تستحق الأفضل"
                      : "Don't compromise, you deserve the finest"}
                </p>
                <span className="mx-auto block h-1 w-8 bg-accent-gold" aria-hidden />
                <p className="mx-auto max-w-xl text-[13px] text-text-muted sm:text-[14px]">
                  {catalog === "import"
                    ? ar
                      ? "اسأل عن قطعة، غرفة، أو أرفق صورة. الأسعار من الكتالوج المستورد."
                      : "Ask about a piece, a room, or attach a photo. Prices come from this imported catalog."
                    : ar
                      ? "اسأل عن العروض الحالية، أو غرفة، أو أرفق صورة."
                      : "Ask about current sale categories, a room, or attach a photo."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {(catalog === "import" ? IMPORT_SUGGESTIONS : SUGGESTIONS)[ar ? "ar" : "en"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    className={`midas-btn-pill min-h-11 text-[12px] sm:min-h-12 sm:text-[14px] ${ar ? "tracking-normal" : "uppercase tracking-[0.03em]"}`}
                    data-testid={`suggest-${s}`}
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
                  <p className="text-center text-[12px] font-semibold tracking-[0.03em] text-accent-red uppercase">
                    {catalog === "import"
                      ? ar
                        ? "من هذا الكتالوج"
                        : "From this catalog"
                      : ar
                        ? "عروض حية من الكتالوج"
                        : "Live from this store’s sale categories"}
                  </p>
                  <div className={`grid gap-3 ${dock ? "grid-cols-1" : "sm:grid-cols-3"}`}>
                    {featured.map((p) => (
                      <ProductCard
                        key={p.sku}
                        product={p}
                        ar={ar}
                        country={country}
                        sameOrigin={catalog === "mirror"}
                        onAddToCart={addToCart}
                      />
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
                  className={`whitespace-pre-line rounded-[10px] px-3 py-2 text-[14px] leading-relaxed ${
                    m.role === "user" ? "bg-ink text-on-ink" : "bg-surface-off text-ink"
                  }`}
                  data-testid={m.role === "assistant" ? "chat-assistant-message" : "chat-user-message"}
                >
                  {m.imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imagePreview} alt="" className="mb-2 max-h-40 object-cover" />
                  ) : null}
                  {m.content}
                </div>
                {m.ui?.products?.length ? (
                  <div className={dock || m.ui.products.length === 1 ? "max-w-sm" : "grid gap-3 sm:grid-cols-2"}>
                    {m.ui.products.map((p) => (
                      <ProductCard
                        key={p.sku}
                        product={p}
                        ar={ar}
                        country={country}
                        sameOrigin={catalog === "mirror"}
                        onAddToCart={addToCart}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {pending ? (
            <div className="midas-loader flex items-center gap-2 text-[14px]">
              <Loader2 className="size-4 animate-spin" />
              {ar ? "أبحث في كتالوج هذا المتجر…" : "Searching this store’s catalog…"}
            </div>
          ) : null}
          {error ? <p className="text-[14px] text-accent-red">{error}</p> : null}
          {cartNote ? <p className="text-[13px] text-text-muted">{cartNote}</p> : null}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        className="shrink-0 border-t border-line bg-page p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        {image ? (
          <div className="mb-2 flex items-center gap-2 text-[12px] text-text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-12 w-12 object-cover" />
            <button type="button" className="min-h-11 underline" onClick={() => setImage(null)}>
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
            className="size-14 shrink-0"
            onClick={() => fileRef.current?.click()}
            aria-label={ar ? "إرفاق صورة" : "Upload photo"}
          >
            <ImagePlus className="size-5" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ar ? "اسأل عن غرفة، مقاس، أو أرفق صورة…" : "Ask about a room, size, or attach a photo…"}
            className="midas-input min-h-14 max-h-32 flex-1 resize-none py-3 text-[16px]"
            rows={1}
            data-testid="chat-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <Button type="submit" className="size-14 shrink-0" disabled={pending} aria-label={ar ? "إرسال" : "Send"} data-testid="chat-send">
            <Send className="size-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
