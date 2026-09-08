"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, FileSpreadsheet, Link2 } from "lucide-react";
import type { TenantRecord } from "@/lib/importedCatalog";

type PreviewRow = { sku: string; name: string; final_price: number; currency: string; stock_status: string };

export function SetupForm({ initialTenants }: { initialTenants: TenantRecord[] }) {
  const [source, setSource] = useState<"csv" | "rest">("csv");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState(initialTenants);
  const [created, setCreated] = useState<TenantRecord | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const origin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);

  const snippet = created
    ? `<script src="${origin}/widget/midas-ai.js" data-catalog="import" data-tenant="${created.id}" async></script>`
    : "";

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
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setPending(false);
    }
  }

  function takeFile(file: File | undefined) {
    if (!file || !fileRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileRef.current.files = transfer.files;
    setFileName(file.name);
  }

  async function copySnippet() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto max-w-xl space-y-14">
      <form className="space-y-10" onSubmit={onSubmit}>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#c4a35a] uppercase">The store</p>
          <h2 className="font-display text-[32px] leading-tight tracking-tight">Who are we dressing?</h2>
          <p className="text-[15px] leading-relaxed text-[#6f685c]">
            This is the same assistant Midas will use. Magento stays the Midas adapter. Here you attach any other
            house by name and feed.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="space-y-1 text-[12px] font-semibold tracking-[0.08em] uppercase">
            Client name
            <input name="name" required placeholder="Harbour Home" className="atelier-field font-normal tracking-normal normal-case" />
          </label>
          <label className="space-y-1 text-[12px] font-semibold tracking-[0.08em] uppercase">
            Store URL
            <input
              name="storeUrl"
              type="url"
              required
              placeholder="https://harbourhome.com"
              className="atelier-field font-normal tracking-normal normal-case"
            />
          </label>
          <label className="space-y-1 text-[12px] font-semibold tracking-[0.08em] uppercase">
            Language
            <select name="language" className="atelier-field font-normal tracking-normal normal-case" defaultValue="en">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </label>
          <label className="space-y-1 text-[12px] font-semibold tracking-[0.08em] uppercase">
            Currency
            <select name="currency" className="atelier-field font-normal tracking-normal normal-case" defaultValue="USD">
              {["USD", "EUR", "GBP", "AED", "KWD", "QAR", "SAR", "JOD", "BHD"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold tracking-[0.08em] uppercase">How the catalog arrives</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="atelier-choice" data-active={source === "csv"} onClick={() => setSource("csv")}>
              <FileSpreadsheet className="size-5" aria-hidden />
              <span className="text-[15px] font-semibold">Spreadsheet</span>
              <span className="text-[13px] text-[#6f685c]">CSV with sku, name, and price when you have it.</span>
            </button>
            <button type="button" className="atelier-choice" data-active={source === "rest"} onClick={() => setSource("rest")}>
              <Link2 className="size-5" aria-hidden />
              <span className="text-[15px] font-semibold">REST feed</span>
              <span className="text-[13px] text-[#6f685c]">JSON array or {`{ "products": [] }`} from their API.</span>
            </button>
          </div>
        </div>

        {source === "csv" ? (
          <div className="space-y-3">
            <input
              ref={fileRef}
              name="csv"
              type="file"
              accept=".csv,text/csv"
              required={source === "csv"}
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            <button
              type="button"
              className="atelier-drop w-full"
              data-over={over}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                takeFile(e.dataTransfer.files[0]);
              }}
            >
              <p className="font-display text-[22px]">{fileName ?? "Drop the catalog"}</p>
              <p className="mt-1 text-[13px] text-[#6f685c]">
                {fileName ? "Click to replace" : "or click to choose a .csv"}
              </p>
            </button>
            <p className="text-[13px] leading-relaxed text-[#6f685c]">
              Required: <code>sku</code>, <code>name</code>. Also used: price, regular_price, currency, stock, url,
              image, category, brand, color, material.{" "}
              <a className="underline decoration-[#c4a35a] underline-offset-4" href="/samples/catalog.csv">
                Sample CSV
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <label className="space-y-1 text-[12px] font-semibold tracking-[0.08em] uppercase">
              Products JSON URL
              <input
                name="restUrl"
                type="url"
                placeholder="https://harbourhome.com/api/products"
                className="atelier-field font-normal tracking-normal normal-case"
              />
            </label>
            <label className="space-y-1 text-[12px] font-semibold tracking-[0.08em] uppercase">
              Bearer token <span className="font-normal tracking-normal text-[#6f685c]">optional</span>
              <input name="restToken" type="password" autoComplete="off" className="atelier-field font-normal tracking-normal normal-case" />
            </label>
            <p className="text-[13px] leading-relaxed text-[#6f685c]">
              Accepts a JSON array or <code>{`{ "products": [] }`}</code> with sku, name, price, url. Local rehearsal:{" "}
              <code>/samples/products.json</code> on this host.
            </p>
          </div>
        )}

        {error ? <p className="text-[14px] text-[#9b2c2c]">{error}</p> : null}

        <button type="submit" className="atelier-btn w-full sm:w-auto" disabled={pending}>
          {pending ? "Importing catalog…" : "Open this store"}
          {pending ? null : <ArrowUpRight className="size-4" aria-hidden />}
        </button>
        <p className="text-[12px] leading-relaxed text-[#6f685c]">
          Catalogs live on this server’s disk. On Vercel they reset when the instance sleeps until a database is
          added.
        </p>
      </form>

      {created ? (
        <section className="space-y-5 border border-[#161412]/15 bg-[#faf7f1] p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#c4a35a] uppercase">Showroom ready</p>
          <h3 className="font-display text-[30px] leading-tight">{created.name}</h3>
          <span className="atelier-rule" aria-hidden />
          <p className="text-[14px] text-[#6f685c]">
            {created.productCount} pieces · {created.source.toUpperCase()} · {created.currency}
          </p>
          <a href={`/t/${created.id}`} className="atelier-btn">
            Enter the showroom
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">Script for their site</p>
              <button type="button" className="atelier-ghost" onClick={() => void copySnippet()}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto bg-[#161412] p-4 text-[11px] leading-relaxed text-[#f3eee4]">{snippet}</pre>
          </div>
          {preview.length ? (
            <ul className="space-y-2 border-t border-[#161412]/10 pt-4 text-[13px]">
              {preview.map((p) => (
                <li key={p.sku} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {p.name} <span className="text-[#6f685c]">· {p.sku}</span>
                  </span>
                  <span dir="ltr">
                    {p.final_price} {p.currency}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tenants.length ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-[28px] leading-tight">Houses on file</h2>
            <span className="text-[12px] tracking-[0.08em] text-[#6f685c] uppercase">{tenants.length} saved</span>
          </div>
          <ul className="divide-y divide-[#161412]/10 border-y border-[#161412]/10">
            {tenants.map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <div>
                  <p className="font-display text-[22px] leading-tight">{t.name}</p>
                  <p className="mt-1 text-[13px] text-[#6f685c]">
                    {t.productCount} pieces · {t.source} · {t.currency} · {t.storeUrl.replace(/^https?:\/\//, "")}
                  </p>
                </div>
                <a className="atelier-ghost" href={`/t/${t.id}`}>
                  Showroom
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
