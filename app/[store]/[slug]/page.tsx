import { notFound } from "next/navigation";
import { MirrorAddToCart } from "@/components/mirror-add-to-cart";
import { MirrorDepartmentView } from "@/components/mirror-department-view";
import { ProductJsonLd } from "@/components/product-json-ld";
import { findByUrlKey, isMirrorNavSlug, MIRROR_NAV_SLUGS, MIRROR_PRODUCTS } from "@/lib/mirrorCatalog";
import { CURRENCY_AR, isStoreCode, sessionFromStoreCode, STORE_CODES } from "@/lib/stores";

export function generateStaticParams() {
  return STORE_CODES.flatMap((store) => [
    ...MIRROR_NAV_SLUGS.map((slug) => ({ store, slug })),
    ...MIRROR_PRODUCTS.map((product) => ({ store, slug: product.url_key })),
  ]);
}

export default async function MirrorSlugPage({
  params,
}: {
  params: Promise<{ store: string; slug: string }>;
}) {
  const { store, slug } = await params;
  if (!isStoreCode(store)) notFound();
  if (isMirrorNavSlug(slug)) {
    return <MirrorDepartmentView store={store} slug={slug} />;
  }
  const product = findByUrlKey(slug);
  if (!product) notFound();
  const session = sessionFromStoreCode(store, { catalog: "mirror", page_sku: product.sku });
  const ar = session.language === "ar";
  const price = product.byWebsite[session.website];
  const cur = ar ? CURRENCY_AR[session.currency] : session.currency;
  const inStock = price.stock === "IN_STOCK";

  return (
    <>
      <ProductJsonLd product={product} session={session} />
      <article
      className="grid gap-8 md:grid-cols-2"
      data-product-sku={product.sku}
      data-testid="mirror-pdp"
    >
      <div className="relative bg-surface-muted">
        {price.final < price.regular ? (
          <span className="midas-sale-badge absolute start-0 top-0">
            {Math.round((1 - price.final / price.regular) * 100)}%
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt={product.name[session.language]} className="w-full object-contain p-6" />
      </div>
      <div className="space-y-4">
        <p className="text-[12px] uppercase tracking-[0.03em] text-text-muted">{product.manufacturer}</p>
        <h1 className="font-display text-[32px] leading-tight">{product.name[session.language]}</h1>
        <p className="text-[14px] font-semibold" dir="ltr">
          SKU {product.sku}
        </p>
        <div dir="ltr">
          {price.final < price.regular ? (
            <p className="text-[14px] text-text-muted line-through">
              {price.regular} {cur}
            </p>
          ) : null}
          <p className="text-[24px] font-semibold">
            {price.final} {cur}
          </p>
        </div>
        <p className="text-[14px] text-text-muted">
          {inStock
            ? ar
              ? `متوفر في متجر ${session.currency} التجريبي.`
              : `In stock on this ${session.currency} demo store.`
            : ar
              ? "غير متوفر في هذا المتجر التجريبي — جرّب دولة أخرى."
              : "Not in stock on this demo store — switch country in the bar above."}
        </p>
        <MirrorAddToCart store={store} sku={product.sku} inStock={inStock} ar={ar} />
      </div>
    </article>
    </>
  );
}
