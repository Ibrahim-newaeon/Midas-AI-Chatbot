import { notFound } from "next/navigation";
import { MirrorProductGrid } from "@/components/mirror-product-card";
import { MIRROR_NAV, MIRROR_NAV_SLUGS, productsInDepartment } from "@/lib/mirrorCatalog";
import { CURRENCY_AR, isStoreCode, sessionFromStoreCode, STORE_CODES, WEBSITE_NAME } from "@/lib/stores";

export function generateStaticParams() {
  return STORE_CODES.map((store) => ({ store }));
}

export default async function MirrorHome({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  if (!isStoreCode(store)) notFound();
  const session = sessionFromStoreCode(store, { catalog: "mirror" });
  const ar = session.language === "ar";
  const country = WEBSITE_NAME[session.website][ar ? "ar" : "en"];
  const cur = ar ? CURRENCY_AR[session.currency] : session.currency;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="font-display text-[32px] leading-tight text-ink">
          {ar ? `متجر ميداس التجريبي — ${country}` : `Midas demo store — ${country}`}
        </p>
        <p className="max-w-2xl text-[14px] text-text-muted">
          {ar
            ? `ثماني قطع لكل قسم (معيشة، سفرة، غرف نوم) وثماني عروض. الأسعار أدناه تجريبية بعملة ${cur} وليست تحويل عملة. ميداس AI على هذه الصفحة يقرأ كتالوج المرآة.`
            : `Eight pieces in Living, Dining, and Bedrooms, plus eight Offers. Prices below are ${cur} fixtures, not currency conversions. Midas AI on this page reads the mirror catalog.`}
        </p>
      </div>
      {MIRROR_NAV_SLUGS.map((slug) => {
        const nav = MIRROR_NAV[slug];
        const products = productsInDepartment(slug);
        return (
          <section key={slug} id={slug} className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-[24px] leading-tight">
                {ar ? nav.magentoAr : nav.magentoEn}
              </h2>
              <a href={`/${store}/${slug}`} className="text-[13px] font-semibold uppercase underline">
                {ar ? "عرض الكل" : "View all"}
              </a>
            </div>
            <MirrorProductGrid store={store} products={products} session={session} />
          </section>
        );
      })}
    </div>
  );
}
