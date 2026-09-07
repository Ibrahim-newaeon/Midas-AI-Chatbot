import { embedQuery } from "./embeddings";

export type PineconeHit = {
  sku: string;
  store_code: string;
  score: number;
};

function configured() {
  const key = process.env.PINECONE_API_KEY?.trim();
  const host = process.env.PINECONE_INDEX_HOST?.trim();
  return key && host ? { key, host: host.replace(/\/$/, "") } : null;
}

export function pineconeEnabled() {
  return Boolean(configured());
}

type QueryResponse = {
  matches?: Array<{
    id?: string;
    score?: number;
    metadata?: { sku?: string; store_code?: string; name?: string };
  }>;
};

/**
 * L4 recall only: SKU ids + copy metadata. Never read price/stock from Pinecone.
 * No-ops when PINECONE_API_KEY / PINECONE_INDEX_HOST are unset.
 */
export async function queryPinecone(storeCode: string, query: string, topK = 40): Promise<PineconeHit[]> {
  const cfg = configured();
  if (!cfg) return [];
  try {
    const vector = await embedQuery(query);
    const res = await fetch(`${cfg.host}/query`, {
      method: "POST",
      headers: {
        "Api-Key": cfg.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        namespace: storeCode,
        vector,
        topK,
        includeMetadata: true,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as QueryResponse;
    const hits: PineconeHit[] = [];
    for (const m of json.matches ?? []) {
      const sku = m.metadata?.sku || m.id?.split(":").pop();
      const store = m.metadata?.store_code || storeCode;
      if (!sku || store !== storeCode) continue;
      hits.push({ sku, store_code: store, score: m.score ?? 0 });
    }
    return hits;
  } catch {
    return [];
  }
}

/** Upsert copy-only vectors. Call from a batch indexer — not the live chat path. */
export async function upsertPinecone(
  storeCode: string,
  records: Array<{ sku: string; values: number[]; name: string; url_key: string; categories: string }>,
): Promise<{ ok: boolean; upserted: number; error?: string }> {
  const cfg = configured();
  if (!cfg) return { ok: false, upserted: 0, error: "pinecone_disabled" };
  try {
    const res = await fetch(`${cfg.host}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": cfg.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        namespace: storeCode,
        vectors: records.map((r) => ({
          id: `${storeCode}:${r.sku}`,
          values: r.values,
          metadata: {
            sku: r.sku,
            store_code: storeCode,
            name: r.name,
            url_key: r.url_key,
            categories: r.categories,
          },
        })),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return { ok: false, upserted: 0, error: `pinecone_http_${res.status}` };
    }
    return { ok: true, upserted: records.length };
  } catch (err) {
    return { ok: false, upserted: 0, error: err instanceof Error ? err.message : "pinecone_error" };
  }
}
