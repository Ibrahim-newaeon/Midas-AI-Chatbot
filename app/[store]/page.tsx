import { notFound } from "next/navigation";
import { MIRROR_PRODUCTS } from "@/lib/mirrorCatalog";
import { CURRENCY_AR, isStoreCode, sessionFromStoreCode, STORE_CODES, WEBSITE_NAME } from "@/lib/stores";

export function generateStaticParams() {
  return STORE_CODES.map((store) => ({ store }));
}

export default async function MirrorHome({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  if (!isStoreCode(store)) notFound();
  const session = sessionFromStoreCode(store, { catalog: "mirror" });
  const ar = session.language === "ar";
  const cur = ar ? CURRENCY_AR[session.currency] : session.currency;
  const country = WEBSITE_NAME[session.website][ar ? "ar" : "en"];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-display text-[32px] leading-tight text-ink">
          {ar ? `متجر ميداس التجريبي — ${country}` : `Midas demo store — ${country}`}
        </p>
        <p className="max-w-2xl text-[14px] text-text-muted">
          {ar
            ? "صفحتان لكل دولة (إنجليزي / عربي). الأسعار أدناه تجريبية وليست تحويل عملة. ميداس AI على هذه الصفحة يقرأ كتالوج المرآة."
            : "Two pages per country (English / Arabic). Prices below are fixtures, not currency conversions. Midas AI on this page reads the mirror catalog."}
        </p>
      </div>
      <div id="offers" className="grid gap-4 sm:grid-cols-2">
        {MIRROR_PRODUCTS.map((product) => {
          const price = product.byWebsite[session.website];
          return (
            <a
              key={product.sku}
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
        })}
      </div>
    </div>
  );
}
