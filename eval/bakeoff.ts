import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { runGoldenEval } from "./run-eval";
import { candidateFromEnv, type ModelCandidate } from "../lib/models";

/**
 * Bake-off harness. Today the live candidate is the rules orchestrator.
 * Add a row to candidates.json and set OPENAI_CHAT_MODEL only when you are ready to score a provider.
 */
export async function runBakeoff(candidates: ModelCandidate[] = [candidateFromEnv()]) {
  const scored = [];
  for (const candidate of candidates) {
    if (candidate.engine !== "rules") {
      scored.push({
        candidate,
        skipped: true,
        reason: "Live chat is still the rules orchestrator. Do not score an LLM until Magento grounding stays green on the golden set.",
      });
      continue;
    }
    const report = await runGoldenEval();
    scored.push({
      candidate,
      skipped: false,
      score: report.score,
      passed: report.passed,
      total: report.total,
      families: report.families,
    });
  }
  const out = {
    generated_at: new Date().toISOString(),
    note: "Choose the primary chat model by this file, not by a leaderboard. Arabic dialect score is a selection criterion.",
    scored,
  };
  const dir = path.join(process.cwd(), "eval", "reports");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "bakeoff.json"), JSON.stringify(out, null, 2));
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runBakeoff()
    .then((out) => {
      console.log(JSON.stringify(out.scored, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
