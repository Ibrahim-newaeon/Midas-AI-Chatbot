import { notFound } from "next/navigation";
import { MidasAiWidget } from "@/components/midas-ai-widget";
import { getTenant } from "@/lib/importedCatalog";

export const dynamic = "force-dynamic";

export default async function TenantStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();
  const lockedStore = tenant.language === "ar" ? "ar" : "en";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <p className="border-b border-line bg-surface-off py-2 text-center text-[13px]">
        <a className="underline" href="/setup">
          Setup
        </a>
        {" · "}
        Imported catalog rehearsal — not Magento. Add to cart opens the client product URL.
      </p>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-accent-red uppercase">{tenant.source} catalog</p>
        <h1 className="font-display mt-2 text-[36px] leading-tight text-ink">{tenant.name}</h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {tenant.productCount} products · {tenant.currency} ·{" "}
          <a className="underline" href={tenant.storeUrl} target="_blank" rel="noreferrer">
            {tenant.storeUrl}
          </a>
        </p>
        <p className="mt-6 max-w-xl text-[15px] text-ink">
          Ask Try Midas AI for a product from this import. Prices come from the CSV or REST snapshot, not live Magento.
        </p>
      </main>
      <MidasAiWidget lockedStore={lockedStore} catalog="import" tenantId={tenant.id} defaultOpen />
    </div>
  );
}
