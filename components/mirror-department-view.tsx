import { MirrorProductGrid } from "@/components/mirror-product-card";
import { MIRROR_NAV, productsInDepartment, type MirrorNavSlug } from "@/lib/mirrorCatalog";
import { sessionFromStoreCode, type StoreCode } from "@/lib/stores";

export function MirrorDepartmentView({
  store,
  slug,
}: {
  store: StoreCode;
  slug: MirrorNavSlug;
}) {
  const session = sessionFromStoreCode(store, { catalog: "mirror" });
  const ar = session.language === "ar";
  const nav = MIRROR_NAV[slug];
  const products = productsInDepartment(slug);
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[12px] uppercase tracking-[0.03em] text-text-muted">
          <a href={`/${store}/`} className="underline">
            {ar ? "المتجر التجريبي" : "Demo store"}
          </a>
          {" / "}
          {ar ? nav.ar : nav.en}
        </p>
        <h1 className="font-display text-[32px] leading-tight text-ink">{ar ? nav.magentoAr : nav.magentoEn}</h1>
        <p className="text-[14px] text-text-muted">
          {ar
            ? `${products.length} قطع تجريبية في هذا القسم. الأسعار حسب الدولة وليست تحويل عملة.`
            : `${products.length} demo pieces in this department. Prices are per country, not currency conversions.`}
        </p>
      </div>
      <MirrorProductGrid store={store} products={products} session={session} />
    </div>
  );
}
