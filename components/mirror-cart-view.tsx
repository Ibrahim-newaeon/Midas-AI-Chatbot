"use client";

import { useEffect, useState } from "react";
import { MIRROR_PRODUCTS } from "@/lib/mirrorCatalog";
import { CURRENCY_AR, STORE_MAP, type StoreCode } from "@/lib/stores";
import { readMirrorCart, writeMirrorCart } from "@/components/mirror-add-to-cart";

export function MirrorCartView({ store }: { store: StoreCode }) {
  const meta = STORE_MAP[store];
  const ar = meta.language === "ar";
  const cur = ar ? CURRENCY_AR[meta.currency] : meta.currency;
  const [items, setItems] = useState<Array<{ sku: string; qty: number }>>([]);

  useEffect(() => {
    setItems(readMirrorCart(store));
  }, [store]);

  if (!items.length) {
    return (
      <p className="text-[14px] text-text-muted">
        {ar ? "سلة التجربة فارغة." : "The demo cart is empty."}
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((line) => {
        const product = MIRROR_PRODUCTS.find((p) => p.sku === line.sku);
        if (!product) return null;
        const price = product.byWebsite[meta.website];
        return (
          <li key={line.sku} className="midas-card flex gap-4 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image_url} alt="" className="h-24 w-24 object-contain" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">{product.name[meta.language]}</p>
              <p className="text-[13px] text-text-muted">SKU {line.sku}</p>
              <p dir="ltr">
                {price.final} {cur} × {line.qty}
              </p>
              <button
                type="button"
                className="text-[13px] underline"
                onClick={() => {
                  const next = items.filter((i) => i.sku !== line.sku);
                  writeMirrorCart(store, next);
                  setItems(next);
                }}
              >
                {ar ? "إزالة" : "Remove"}
              </button>
            </div>
          </li>
        );
      })}
      <p className="text-[12px] text-text-muted">
        {ar
          ? "هذه سلة محلية للمتجر التجريبي. لن تُرسل إلى ماجنتو ميداس."
          : "This cart lives in this browser for the demo storefront. It is not sent to live Midas Magento."}
      </p>
    </ul>
  );
}
