"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TenantRecord } from "@/lib/importedCatalog";

type PreviewRow = { sku: string; name: string; final_price: number; currency: string; stock_status: string };

export function SetupForm({ initialTenants }: { initialTenants: TenantRecord[] }) {
  const [source, setSource] = useState<"csv" | "rest">("csv");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState(initialTenants);
  const [created, setCreated] = useState<TenantRecord | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const origin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("source", source);
    try {
      const res = await fetch("/api/setup", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Import failed");
      setCreated(json.tenant);
      setPreview(json.preview ?? []);
      const list = await fetch("/api/setup").then((r) => r.json());
      if (list.ok) setTenants(list.tenants);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-10">
      <form className="midas-card space-y-5 p-5 sm:p-6" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-[13px]">
            <span className="font-semibold">Client name</span>
            <Input name="name" required placeholder="Harbour Home" />
          </label>
          <label className="space-y-1 text-[13px]">
            <span className="font-semibold">Store URL</span>
            <Input name="storeUrl" type="url" required placeholder="https://harbourhome.com" />
          </label>
          <label className="space-y-1 text-[13px]">
            <span className="font-semibold">Language</span>
            <select name="language" className="midas-input h-11 w-full px-5 text-[14px]" defaultValue="en">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </label>
          <label className="space-y-1 text-[13px]">
            <span className="font-semibold">Currency</span>
            <select name="currency" className="midas-input h-11 w-full px-5 text-[14px]" defaultValue="USD">
              {["USD", "EUR", "GBP", "AED", "KWD", "QAR", "SAR", "JOD", "BHD"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={`midas-btn-pill min-h-11 px-4 text-[13px] ${source === "csv" ? "midas-btn-pill-ink" : ""}`}
            onClick={() => setSource("csv")}
          >
            Upload CSV
          </button>
          <button
            type="button"
            className={`midas-btn-pill min-h-11 px-4 text-[13px] ${source === "rest" ? "midas-btn-pill-ink" : ""}`}
            onClick={() => setSource("rest")}
          >
            REST connector
          </button>
        </div>

        {source === "csv" ? (
          <div className="space-y-2">
            <label className="space-y-1 text-[13px]">
              <span className="font-semibold">Catalog CSV</span>
              <Input name="csv" type="file" accept=".csv,text/csv" required={source === "csv"} />
            </label>
            <p className="text-[13px] text-text-muted">
              Required columns: <code>sku</code>, <code>name</code>. Also used when present: price, regular_price,
              currency, stock, url, image, category, brand, color, material.{" "}
              <a className="underline" href="/samples/catalog.csv">
                Download sample CSV
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="space-y-1 text-[13px]">
              <span className="font-semibold">Products JSON URL</span>
              <Input name="restUrl" type="url" placeholder="https://harbourhome.com/api/products" />
            </label>
            <label className="space-y-1 text-[13px]">
              <span className="font-semibold">Bearer token (optional)</span>
              <Input name="restToken" type="password" autoComplete="off" />
            </label>
            <p className="text-[13px] text-text-muted">
              Accepts a JSON array or <code>{`{ "products": [] }`}</code> with sku, name, price, url. Local demo:{" "}
              <code>/samples/products.json</code> on this host.
            </p>
          </div>
        )}

        {error ? <p className="text-[14px] text-accent-red">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Save store"}
        </Button>
        <p className="text-[12px] text-text-muted">
          Catalogs are stored on this server’s disk. On Vercel they reset when the instance sleeps unless you add a
          database later.
        </p>
      </form>

      {created ? (
        <section className="midas-card space-y-3 p-5">
          <p className="font-semibold text-ink">{created.name} is ready</p>
          <p className="text-[14px] text-text-muted">
            {created.productCount} products · {created.source.toUpperCase()} · {created.currency}
          </p>
          <p className="text-[14px]">
            <a className="font-semibold underline" href={`/t/${created.id}`}>
              Open rehearsal chat
            </a>
          </p>
          <pre className="overflow-x-auto bg-surface-off p-3 text-[12px] leading-relaxed">
            {`<script src="${origin}/widget/midas-ai.js" data-catalog="import" data-tenant="${created.id}" async></script>`}
          </pre>
          {preview.length ? (
            <ul className="space-y-1 text-[13px]">
              {preview.map((p) => (
                <li key={p.sku}>
                  {p.sku} · {p.name} · {p.final_price} {p.currency} · {p.stock_status}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tenants.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-[24px] text-ink">Saved stores</h2>
          <ul className="space-y-3">
            {tenants.map((t) => (
              <li key={t.id} className="midas-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-[13px] text-text-muted">
                    {t.productCount} products · {t.source} · {t.currency} · {t.storeUrl}
                  </p>
                </div>
                <a className="underline text-[14px]" href={`/t/${t.id}`}>
                  Open chat
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
