"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { trackChat } from "@/lib/analytics";
import type { StoreCode } from "@/lib/stores";

export function MidasAiWidget({
  lockedStore,
  pageSku,
  catalog = "live",
  embed = false,
  defaultOpen = false,
}: {
  lockedStore?: StoreCode;
  pageSku?: string | null;
  catalog?: "live" | "mirror";
  embed?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [mobile, setMobile] = useState(false);
  const titleId = useId();
  const ar = lockedStore ? lockedStore.endsWith("ar") || lockedStore === "ar" : false;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (mobile && !embed) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, mobile, embed]);

  const wasOpen = useRef(defaultOpen);

  useEffect(() => {
    if (open && !wasOpen.current) trackChat("chat_open", { store_code: lockedStore ?? null });
    if (!open && wasOpen.current) trackChat("chat_close", { store_code: lockedStore ?? null });
    wasOpen.current = open;
    if (!embed) return;
    window.parent?.postMessage({ type: "midas:frame", open, mobile }, "*");
  }, [open, mobile, embed, lockedStore]);

  const fab = (
    <button
      type="button"
      className="midas-ai-fab pointer-events-auto"
      data-testid="midas-ai-launcher"
      aria-expanded={open}
      aria-controls={open ? titleId : undefined}
      onClick={() => setOpen(true)}
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="max-sm:sr-only">{ar ? "ميداس AI" : "Try Midas AI"}</span>
    </button>
  );

  if (!open) {
    if (embed) {
      return <div className="flex h-full w-full items-end justify-end p-4">{fab}</div>;
    }
    return <div className="fixed end-4 bottom-4 z-[80]" data-testid="midas-ai-widget">{fab}</div>;
  }

  const panel = (
    <section
      id={titleId}
      role="dialog"
      aria-label="Midas AI"
      data-testid="midas-ai-panel"
      className={
        mobile
          ? "flex h-full min-h-0 w-full flex-col bg-page pt-[env(safe-area-inset-top)]"
          : "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[10px] border border-line bg-page shadow-[0_12px_40px_rgba(18,17,17,0.18)]"
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatWidget lockedStore={lockedStore} pageSku={pageSku} catalog={catalog} variant="dock" onClose={() => setOpen(false)} />
      </div>
    </section>
  );

  if (embed) {
    return (
      <div className={mobile ? "h-dvh w-screen bg-page" : "flex h-full w-full items-end justify-end p-3"}>
        <div className={mobile ? "h-full w-full" : "h-full w-[400px]"}>{panel}</div>
      </div>
    );
  }

  if (mobile) {
    return <div className="fixed inset-0 z-[80] bg-page" data-testid="midas-ai-widget">{panel}</div>;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" data-testid="midas-ai-widget">
      <div className="pointer-events-auto absolute end-4 bottom-4 flex h-[min(720px,calc(100dvh-2rem))] w-[min(400px,calc(100vw-2rem))] flex-col">
        {panel}
      </div>
    </div>
  );
}
