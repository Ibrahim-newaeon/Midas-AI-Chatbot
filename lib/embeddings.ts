/** Local hashed n-gram embeddings. Embed raw Arabic/English copy — never stemmed tokens, never prices. */

export const EMBED_DIM = 256;

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function l2Normalize(values: number[]): number[] {
  let sum = 0;
  for (const v of values) sum += v * v;
  const n = Math.sqrt(sum) || 1;
  return values.map((v) => v / n);
}

/** Character 3-grams into a fixed dense vector. No network. */
export function embedText(text: string): number[] {
  const raw = text.normalize("NFC").trim();
  const vec = new Array<number>(EMBED_DIM).fill(0);
  if (raw.length < 3) {
    if (raw.length) vec[hash32(raw) % EMBED_DIM] = 1;
    return l2Normalize(vec);
  }
  for (let i = 0; i < raw.length - 2; i++) {
    const gram = raw.slice(i, i + 3);
    vec[hash32(gram) % EMBED_DIM] += 1;
  }
  return l2Normalize(vec);
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export function copyText(parts: Array<string | null | undefined>): string {
  return parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function embedQuery(text: string): Promise<number[]> {
  const model = process.env.OPENAI_EMBEDDING_MODEL;
  const key = process.env.OPENAI_API_KEY;
  if (!model || !key) return embedText(text);
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return embedText(text);
    const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const vec = json.data?.[0]?.embedding;
    return vec?.length ? l2Normalize(vec) : embedText(text);
  } catch {
    return embedText(text);
  }
}
