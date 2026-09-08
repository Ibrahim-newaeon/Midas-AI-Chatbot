import { notFound } from "next/navigation";
import { AtelierNav } from "@/components/atelier-nav";
import { MidasAiWidget } from "@/components/midas-ai-widget";
import { getTenant } from "@/lib/importedCatalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getTenant(id);
  return {
    title: tenant ? `${tenant.name} — Midas AI` : "Showroom — Midas AI",
  };
}

export default async function TenantStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();
  const lockedStore = tenant.language === "ar" ? "ar" : "en";
  const host = tenant.storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="atelier flex min-h-dvh flex-col">
      <AtelierNav kicker={tenant.name} current="showroom" />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex flex-col justify-between border-b border-[#161412]/15 px-6 py-8 sm:px-10 lg:w-[34%] lg:border-e lg:border-b-0 lg:px-12 lg:py-12">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#c4a35a] uppercase">
              {tenant.source} catalog · not Magento
            </p>
            <h1 className="font-display text-[40px] leading-[1.05] tracking-tight sm:text-[46px]">{tenant.name}</h1>
            <span className="atelier-rule" aria-hidden />
            <p className="text-[15px] leading-relaxed text-[#6f685c]">
              Private showroom for this house. Ask Midas AI about a piece from the imported catalog — prices and
              stock are the snapshot, not live Magento.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 text-[13px]">
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.1em] text-[#6f685c] uppercase">Pieces</dt>
                <dd className="mt-1 text-[16px] font-semibold">{tenant.productCount}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.1em] text-[#6f685c] uppercase">Currency</dt>
                <dd className="mt-1 text-[16px] font-semibold">{tenant.currency}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] font-semibold tracking-[0.1em] text-[#6f685c] uppercase">Store</dt>
                <dd className="mt-1">
                  <a className="underline decoration-[#c4a35a] underline-offset-4" href={tenant.storeUrl} target="_blank" rel="noreferrer">
                    {host}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <p className="mt-10 text-[12px] leading-relaxed text-[#6f685c]">
            Add to cart opens their product URL. A real cart needs their theme to listen for{" "}
            <code>midas:add_to_cart</code>.
          </p>
        </aside>
        <section className="flex min-h-[70vh] flex-1 flex-col p-4 sm:p-6 lg:h-[calc(100dvh-3.4rem)] lg:min-h-0 lg:p-8">
          <div className="chat-stage flex min-h-0 flex-1 flex-col overflow-hidden">
            <MidasAiWidget
              lockedStore={lockedStore}
              catalog="import"
              tenantId={tenant.id}
              clientName={tenant.name}
              currency={tenant.currency}
              presentation="stage"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
