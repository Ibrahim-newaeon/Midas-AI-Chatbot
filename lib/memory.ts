import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { StoreCode } from "./stores";

export type StatedProfile = {
  chat_session_id: string;
  store_code: StoreCode | null;
  lastSkus: string[];
  lastQuery: string | null;
  color: string | null;
  material: string | null;
  room: string | null;
  budget: number | null;
  updatedAt: string;
};

const memory = new Map<string, StatedProfile>();
const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "memory.json");

function empty(id: string): StatedProfile {
  return {
    chat_session_id: id,
    store_code: null,
    lastSkus: [],
    lastQuery: null,
    color: null,
    material: null,
    room: null,
    budget: null,
    updatedAt: new Date().toISOString(),
  };
}

let loaded = false;

async function loadDisk() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StatedProfile[];
    for (const row of parsed) {
      if (row.chat_session_id) memory.set(row.chat_session_id, row);
    }
  } catch {
    // First run or ephemeral filesystem.
  }
}

async function saveDisk() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify([...memory.values()], null, 2));
  } catch {
    // Rehearsal environments may be read-only; in-memory still works for the process.
  }
}

export async function recallProfile(chatSessionId: string | null | undefined): Promise<StatedProfile | null> {
  if (!chatSessionId) return null;
  await loadDisk();
  return memory.get(chatSessionId) ?? null;
}

export async function rememberTurn(input: {
  chat_session_id: string | null | undefined;
  store_code?: StoreCode | null;
  skus?: string[];
  query?: string | null;
  color?: string | null;
  material?: string | null;
  room?: string | null;
  budget?: number | null;
}): Promise<StatedProfile | null> {
  const id = input.chat_session_id?.trim();
  if (!id) return null;
  await loadDisk();
  const prev = memory.get(id) ?? empty(id);
  const mergedSkus = [...(input.skus ?? []), ...prev.lastSkus].filter((s, i, a) => a.indexOf(s) === i).slice(0, 3);
  const next: StatedProfile = {
    chat_session_id: id,
    store_code: input.store_code ?? prev.store_code,
    lastSkus: mergedSkus,
    lastQuery: input.query?.trim() || prev.lastQuery,
    color: input.color ?? prev.color,
    material: input.material ?? prev.material,
    room: input.room ?? prev.room,
    budget: input.budget ?? prev.budget,
    updatedAt: new Date().toISOString(),
  };
  memory.set(id, next);
  await saveDisk();
  return next;
}

export function resetMemoryForTests() {
  memory.clear();
  loaded = true;
}
