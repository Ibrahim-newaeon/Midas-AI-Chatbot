const WINDOW_MS = 60_000;
const MAX = 40;
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max = MAX, windowMs = WINDOW_MS) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (recent.length > max) {
    return { ok: false as const, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000) };
  }
  return { ok: true as const };
}
