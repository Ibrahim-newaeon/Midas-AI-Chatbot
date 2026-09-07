"use client";

import { useState } from "react";
import type { StoreCode } from "@/lib/stores";

const KEY = (store: StoreCode) => `midas-mirror-cart-${store}`;

export function readMirrorCart(store: StoreCode): Array<{ sku: string; qty: number }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY(store));
    return raw ? (JSON.parse(raw) as Array<{ sku: string; qty: number }>) : [];
  } catch {
    return [];
  }
}

export function writeMirrorCart(store: StoreCode, items: Array<{ sku: string; qty: number }>) {
  window.localStorage.setItem(KEY(store), JSON.stringify(items));
}

export function MirrorAddToCart({
  store,
  sku,
  inStock,
  ar,
}: {
  store: StoreCode;
  sku: string;
  inStock: boolean;
  ar: boolean;
}) {
  const [note, setNote] = useState<string | null>(null);
  if (!inStock) {
    return (
      <p className="text-[14px] text-accent-red">{ar ? "غير متوفر في هذا المتجر التجريبي" : "Not in stock on this demo store"}</p>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="midas-btn-pill-ink max-w-xs"
        data-testid="mirror-add-to-cart"
        onClick={() => {
          const items = readMirrorCart(store);
          const hit = items.find((i) => i.sku === sku);
          if (hit) hit.qty += 1;
          else items.push({ sku, qty: 1 });
          writeMirrorCart(store, items);
          setNote(ar ? "أُضيف إلى سلة التجربة (ليست سلة ميداس الحية)." : "Added to the demo cart (not the live Midas cart).");
        }}
      >
        {ar ? "أضف إلى السلة" : "Add to cart"}
      </button>
      {note ? <p className="text-[13px] text-text-muted">{note}</p> : null}
    </div>
  );
}
