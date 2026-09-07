import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { normalizeArabic } from "./arabicNormalize";
import type { StoreCode } from "./stores";

export type LearningEvent = {
  id: string;
  at: string;
  store_code: StoreCode | string;
  query: string;
  reason: "unanswered" | "empty_search" | "send_gate" | "catalog_unavailable" | "out_of_catalog";
  chat_session_id: string | null;
};

export type InsightCluster = {
  key: string;
  count: number;
  stores: string[];
  sample_queries: string[];
  last_at: string;
  reasons: string[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "learning-queue.json");
const events: LearningEvent[] = [];
let loaded = false;

async function loadDisk() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as LearningEvent[];
    events.push(...parsed);
  } catch {
    // First run.
  }
}

async function saveDisk() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(events.slice(-2000), null, 2));
  } catch {
    // In-memory is enough for this process.
  }
}

export function clusterKey(query: string): string {
  return normalizeArabic(query)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function recordUnanswered(input: {
  store_code: StoreCode | string;
  query: string;
  reason: LearningEvent["reason"];
  chat_session_id?: string | null;
}): Promise<LearningEvent | null> {
  const query = input.query.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]").replace(/\+?\d[\d\s()-]{7,}\d/g, "[phone]").trim();
  if (!query || query.length < 2) return null;
  await loadDisk();
  const event: LearningEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    store_code: input.store_code,
    query: query.slice(0, 400),
    reason: input.reason,
    chat_session_id: input.chat_session_id ?? null,
  };
  events.push(event);
  await saveDisk();
  return event;
}

export async function merchandisingInsight(): Promise<{
  generated_at: string;
  total: number;
  asked_not_stocked: InsightCluster[];
  note: string;
}> {
  await loadDisk();
  const byKey = new Map<string, LearningEvent[]>();
  for (const e of events) {
    const key = clusterKey(e.query) || e.reason;
    const list = byKey.get(key) ?? [];
    list.push(e);
    byKey.set(key, list);
  }
  const asked_not_stocked = [...byKey.entries()]
    .map(([key, list]) => ({
      key,
      count: list.length,
      stores: [...new Set(list.map((e) => String(e.store_code)))],
      sample_queries: [...new Set(list.map((e) => e.query))].slice(0, 5),
      last_at: list.map((e) => e.at).sort().at(-1) ?? "",
      reasons: [...new Set(list.map((e) => e.reason))],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return {
    generated_at: new Date().toISOString(),
    total: events.length,
    asked_not_stocked,
    note: "Human review only. Nothing here auto-writes the knowledge pack or synonym list.",
  };
}

export function resetLearningQueueForTests() {
  events.length = 0;
  loaded = true;
}
