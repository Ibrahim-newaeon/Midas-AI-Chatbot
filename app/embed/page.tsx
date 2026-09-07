"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MidasAiWidget } from "@/components/midas-ai-widget";
import { isStoreCode } from "@/lib/stores";
import { Suspense } from "react";

function EmbedInner() {
  const params = useSearchParams();
  const storeParam = params.get("store");
  const store = isStoreCode(storeParam) ? storeParam : undefined;
  const catalog = params.get("catalog") === "mirror" ? "mirror" : "live";
  const sku = params.get("sku");
  const defaultOpen = params.get("open") === "1";

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.minHeight = "100%";
  }, []);

  return (
    <MidasAiWidget
      lockedStore={store}
      catalog={catalog}
      pageSku={sku}
      embed
      defaultOpen={defaultOpen}
    />
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedInner />
    </Suspense>
  );
}
