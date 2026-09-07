import { isSeatingIntent, normalizeArabic } from "./arabicNormalize";
import { cosine, embedText } from "./embeddings";

export type CopyDoc = {
  sku: string;
  text: string;
  inStock?: boolean;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "have",
  "something",
  "like",
  "from",
  "that",
  "هل",
  "عندكم",
  "في",
  "من",
  "على",
]);

const DINING_RE = /dining|طعام|سفرة|طاولة طعام/i;
const SEATING_RE = /sofa|sectional|recliner|loveseat|chair|coffee|centre|center|كنب|كرسي|وسط|أريكة|اريكه/i;
const RRF_K = 60;

export function lexicalTokens(text: string): string[] {
  return normalizeArabic(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function idf(df: number, n: number): number {
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}

/** In-turn BM25 over copy text (normalized). */
export function bm25Scores(query: string, docs: CopyDoc[]): Map<string, number> {
  const qTokens = lexicalTokens(query);
  const n = docs.length || 1;
  const tokenized = docs.map((d) => ({ sku: d.sku, tokens: lexicalTokens(d.text) }));
  const avgdl = tokenized.reduce((s, d) => s + d.tokens.length, 0) / n || 1;
  const df = new Map<string, number>();
  for (const t of new Set(qTokens)) {
    df.set(t, tokenized.filter((d) => d.tokens.includes(t)).length);
  }
  const k1 = 1.2;
  const b = 0.75;
  const scores = new Map<string, number>();
  for (const d of tokenized) {
    const tf = termFreq(d.tokens);
    let score = 0;
    for (const t of qTokens) {
      const f = tf.get(t) ?? 0;
      if (!f) continue;
      const w = idf(df.get(t) ?? 0, n);
      score += (w * (f * (k1 + 1))) / (f + k1 * (1 - b + b * (d.tokens.length / avgdl)));
    }
    scores.set(d.sku, score);
  }
  return scores;
}

export function vectorScores(query: string, docs: CopyDoc[]): Map<string, number> {
  const qv = embedText(query);
  const scores = new Map<string, number>();
  for (const d of docs) {
    scores.set(d.sku, cosine(qv, embedText(d.text)));
  }
  return scores;
}

function ranksFromScores(scores: Map<string, number>): Map<string, number> {
  const ordered = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map<string, number>();
  ordered.forEach(([sku], i) => ranks.set(sku, i + 1));
  return ranks;
}

export function reciprocalRankFusion(rankLists: Array<Map<string, number>>, k = RRF_K): Map<string, number> {
  const fused = new Map<string, number>();
  for (const ranks of rankLists) {
    for (const [sku, rank] of ranks) {
      fused.set(sku, (fused.get(sku) ?? 0) + 1 / (k + rank));
    }
  }
  return fused;
}

function rerankScore(
  sku: string,
  doc: CopyDoc,
  query: string,
  rrf: number,
  room: string | null | undefined,
  boostSkus: string[],
): number {
  const majlis = isSeatingIntent(query) || /majlis|majles|diwaniya|مجلس|ديوان/i.test(query) || room === "majlis";
  let score = rrf * 20;
  if (doc.inStock !== false) score += 0.4;
  if (boostSkus.includes(sku)) score += 2.5;
  if (majlis) {
    if (DINING_RE.test(doc.text)) score -= 8;
    if (SEATING_RE.test(doc.text)) score += 1.5;
  }
  const qTokens = lexicalTokens(query);
  const hay = lexicalTokens(doc.text);
  for (const t of qTokens) {
    if (hay.includes(t)) score += 0.35;
  }
  if (/kare|كاري/i.test(query) && /kare|كاري/i.test(doc.text)) score += 1.2;
  if (/ashley|آشلي|اشلي/i.test(query) && /ashley|آشلي|اشلي/i.test(doc.text)) score += 1.2;
  return score;
}

/** Hybrid BM25 + vector + feature rerank. Returns SKUs only — caller fetches Magento truth. */
export function hybridRank(input: {
  query: string;
  docs: CopyDoc[];
  room?: string | null;
  boostSkus?: string[];
  limit?: number;
}): string[] {
  const docs = input.docs.filter((d) => d.sku && d.text);
  if (!docs.length) return [];
  const lexical = ranksFromScores(bm25Scores(input.query, docs));
  const vector = ranksFromScores(vectorScores(input.query, docs));
  const fused = reciprocalRankFusion([lexical, vector]);
  const boostSkus = input.boostSkus ?? [];
  const scored = docs.map((d) => ({
    sku: d.sku,
    score: rerankScore(d.sku, d, input.query, fused.get(d.sku) ?? 0, input.room, boostSkus),
  }));
  scored.sort((a, b) => b.score - a.score);
  const limit = input.limit ?? 10;
  return scored.filter((s) => s.score > -4).slice(0, limit).map((s) => s.sku);
}
