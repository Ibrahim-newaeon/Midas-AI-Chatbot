import type { SessionContext } from "@/lib/stores";
import { CURRENCY_AR } from "@/lib/stores";
import type { MirrorProduct } from "@/lib/mirrorCatalog";

export function MirrorProductCard({
  store,
  product,
  session,
}: {
  store: string;
  product: MirrorProduct;
  session: SessionContext;
}) {
  const ar = session.language === "ar";
  const cur = ar ? CURRENCY_AR[session.currency] : session.currency;
  const price = product.byWebsite[session.website];
  return (
    <a
      href={`/${store}/${product.url_key}.html`}
      className="midas-card block"
      data-testid={`mirror-home-${product.sku}`}
    >
      <div className="relative aspect-[4/3] bg-surface-muted">
        {price.final < price.regular ? (
          <span className="midas-sale-badge absolute start-0 top-0">
            {Math.round((1 - price.final / price.regular) * 100)}%
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name[session.language]} className="h-full w-full object-contain p-4" />
      </div>
      <div className="space-y-1 p-4 text-center">
        <p className="text-[12px] uppercase text-text-muted">{product.manufacturer}</p>
        <p className="font-semibold">{product.name[session.language]}</p>
        <p className="text-[13px] text-text-muted">SKU {product.sku}</p>
        <p dir="ltr" className="font-semibold">
          {price.final} {cur}
          {price.final < price.regular ? (
            <span className="ms-2 text-[12px] font-normal text-text-muted line-through">
              {price.regular} {cur}
            </span>
          ) : null}
        </p>
        <p className="text-[12px] text-text-muted">
          {price.stock === "IN_STOCK"
            ? ar
              ? "متوفر في هذا المتجر التجريبي"
              : "In stock on this demo store"
            : ar
              ? "غير متوفر هنا"
              : "Not in stock here"}
        </p>
      </div>
    </a>
  );
}

export function MirrorProductGrid({
  store,
  products,
  session,
}: {
  store: string;
  products: MirrorProduct[];
  session: SessionContext;
}) {
  if (!products.length) {
    return (
      <p className="text-[14px] text-text-muted">
        {session.language === "ar" ? "لا توجد قطع في هذا القسم الآن." : "No pieces in this department yet."}
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <MirrorProductCard key={product.sku} store={store} product={product} session={session} />
      ))}
    </div>
  );
}
