import { listTenants } from "@/lib/importedCatalog";
import { AtelierNav } from "@/components/atelier-nav";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client atelier — Midas AI",
  description: "Connect a store catalog the same way Midas AI connects to Magento: name, URL, then CSV or REST.",
};

export default async function SetupPage() {
  const tenants = await listTenants();
  return (
    <div className="atelier flex min-h-dvh flex-col">
      <AtelierNav current="setup" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="atelier-dark relative flex flex-col justify-between px-6 py-10 sm:px-10 lg:w-[40%] lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-y-10 end-0 hidden w-px bg-[#c4a35a]/40 lg:block" aria-hidden />
          <div className="max-w-md space-y-6">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#c4a35a] uppercase">Private catalog</p>
            <h1 className="font-display text-[40px] leading-[1.05] tracking-tight sm:text-[48px]">
              Connect a store the way we connect Midas.
            </h1>
            <span className="atelier-rule" aria-hidden />
            <p className="text-[16px] leading-relaxed text-[#f3eee4]/75">
              Magento stays the Midas adapter. Every other client arrives as a catalog — CSV or a REST feed — then
              the same shopping assistant rehearses on their prices and stock.
            </p>
          </div>
          <ol className="mt-12 space-y-5 lg:mt-16">
            <li className="atelier-step">
              <span className="font-display text-[18px] text-[#c4a35a]">01</span>
              <span>
                <strong>Name the house</strong>
                Client name, store URL, language, currency.
              </span>
            </li>
            <li className="atelier-step">
              <span className="font-display text-[18px] text-[#c4a35a]">02</span>
              <span>
                <strong>Bring the catalog</strong>
                Upload a spreadsheet or point at a products JSON feed.
              </span>
            </li>
            <li className="atelier-step">
              <span className="font-display text-[18px] text-[#c4a35a]">03</span>
              <span>
                <strong>Open the showroom</strong>
                Rehearse chat on their pieces, then drop one script tag on their site.
              </span>
            </li>
          </ol>
        </aside>
        <section className="flex-1 px-5 py-10 sm:px-10 lg:px-14 lg:py-14">
          <SetupForm initialTenants={tenants} />
        </section>
      </div>
    </div>
  );
}
