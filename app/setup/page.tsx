import { listTenants } from "@/lib/importedCatalog";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client setup — catalog import",
  description: "Add a client store with a CSV or REST catalog so the widget can run off Magento.",
};

export default async function SetupPage() {
  const tenants = await listTenants();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-[12px] font-semibold tracking-[0.08em] text-accent-red uppercase">Packaging</p>
      <h1 className="font-display mt-3 text-[36px] leading-tight text-ink sm:text-[44px]">Client setup</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text-muted">
        Enter the client’s name and store URL, then upload a CSV or point at a REST products feed. The shopping
        assistant uses that catalog — PHP, HTML, or ASP.NET only need the script tag. Magento stays the Midas
        adapter.
      </p>
      <p className="mt-4 text-[13px]">
        <a className="underline" href="/">
          ← Midas live catalog
        </a>
      </p>
      <div className="mt-8">
        <SetupForm initialTenants={tenants} />
      </div>
    </main>
  );
}
