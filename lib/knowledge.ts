import { readFileSync } from "fs";
import path from "path";
import type { WebsiteId } from "@/lib/stores";

export type PolicyTopic =
  | "delivery"
  | "returns"
  | "payments"
  | "wallet"
  | "showrooms"
  | "hours"
  | "installation"
  | "customization"
  | "customer_care"
  | "complaints";

export const POLICY_TOPICS: PolicyTopic[] = [
  "delivery",
  "returns",
  "payments",
  "wallet",
  "showrooms",
  "hours",
  "installation",
  "customization",
  "customer_care",
  "complaints",
];

const cache = new Map<string, Record<string, string>>();

function parseSections(markdown: string): Record<string, string> {
  const out: Record<string, string> = {};
  const chunks = markdown.split(/^##\s+/m);
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    if (nl < 0) continue;
    const id = chunk
      .slice(0, nl)
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "_")
      .replace(/^_|_$/g, "");
    const body = chunk.slice(nl + 1).trim();
    if (id && body) out[id] = body;
  }
  return out;
}

function loadCountry(website: WebsiteId, language: "en" | "ar"): Record<string, string> {
  const key = `${website}.${language}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const file = path.join(process.cwd(), "knowledge", website, `${language}.md`);
  try {
    const parsed = parseSections(readFileSync(file, "utf8"));
    cache.set(key, parsed);
    return parsed;
  } catch {
    cache.set(key, {});
    return {};
  }
}

export function getKnowledgeText(website: WebsiteId, topic: PolicyTopic, language: "en" | "ar"): string | null {
  const text = loadCountry(website, language)[topic];
  return text?.trim() || null;
}
