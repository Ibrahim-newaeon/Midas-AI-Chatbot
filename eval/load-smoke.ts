import http from "node:http";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:43217";

function post(path: string, body: unknown) {
  return new Promise<{ status: number; ms: number; ok: boolean }>((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(path, BASE);
    const started = Date.now();
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let ok = false;
          try {
            ok = JSON.parse(text).ok === true;
          } catch {
            ok = false;
          }
          resolve({ status: res.statusCode ?? 0, ms: Date.now() - started, ok });
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const n = Number(process.env.LOAD_N ?? 12);
  const times: number[] = [];
  let failed = 0;
  for (let i = 0; i < n; i++) {
    const row = await post("/api/chat", {
      session: { store_code: "en", catalog: "mirror", chat_session_id: `load-${i}` },
      messages: [{ role: "user", content: i % 2 ? "velvet sofa" : "What's on offer?" }],
    });
    times.push(row.ms);
    if (row.status !== 200 || !row.ok) failed += 1;
  }
  times.sort((a, b) => a - b);
  const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))];
  console.log(JSON.stringify({ n, failed, p95_ms: p95, max_ms: times.at(-1) }, null, 2));
  if (failed) process.exitCode = 1;
}

void main();
