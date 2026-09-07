import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { runWithCatalog } from "../lib/catalogContext";
import { judgeTurn, type GoldenCase } from "../lib/evalJudge";
import { runChat } from "../lib/orchestrator";
import { sessionFromStoreCode } from "../lib/stores";

export async function runGoldenEval() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const cases = JSON.parse(await readFile(path.join(root, "golden.json"), "utf8")) as GoldenCase[];
  const results = [];
  for (const c of cases) {
    const session = sessionFromStoreCode(c.store_code, {
      catalog: c.catalog ?? "mirror",
      chat_session_id: `eval-${c.id}`,
      channel: "widget",
    });
    const turn = await runWithCatalog(session.catalog, () =>
      runChat({
        session,
        messages: c.messages,
      }),
    );
    const judged = judgeTurn({
      id: c.id,
      store_code: c.store_code,
      turn,
      expect: c.expect,
    });
    results.push({
      ...judged,
      family: c.family,
      engine: turn.engine,
      tools: turn.used_tools,
      skus: turn.ui.products.map((p) => p.sku),
      message: turn.message.slice(0, 240),
    });
  }
  const passed = results.filter((r) => r.pass).length;
  const report = {
    generated_at: new Date().toISOString(),
    candidate: "rules-orchestrator",
    total: results.length,
    passed,
    failed: results.length - passed,
    score: results.length ? passed / results.length : 0,
    families: Object.fromEntries(
      [...new Set(results.map((r) => r.family))].map((family) => {
        const rows = results.filter((r) => r.family === family);
        return [family, { total: rows.length, passed: rows.filter((r) => r.pass).length }];
      }),
    ),
    results,
  };
  const dir = path.join(process.cwd(), "eval", "reports");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "latest.json"), JSON.stringify(report, null, 2));
  return report;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runGoldenEval()
    .then((report) => {
      console.log(`${report.passed}/${report.total} passed (score ${(report.score * 100).toFixed(1)}%)`);
      for (const row of report.results.filter((r) => !r.pass)) {
        const failed = row.checks.filter((c) => !c.pass).map((c) => c.name);
        console.log(`FAIL ${row.id}: ${failed.join(", ")}`);
      }
      if (report.failed) process.exitCode = 1;
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
