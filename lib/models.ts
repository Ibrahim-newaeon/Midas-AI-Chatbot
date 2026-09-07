/**
 * Provider abstraction. Swapping a model is a config change — bake-off decides, not a blog post.
 * Live chat still uses the rules orchestrator until a scored candidate is promoted.
 */

export type ModelRole =
  | "primary"
  | "query_understanding"
  | "verifier"
  | "embeddings"
  | "reranker"
  | "judge"
  | "batch";

export type EngineId = "rules" | "openai";

export type ModelCandidate = {
  id: string;
  engine: EngineId;
  label: string;
  roles: ModelRole[];
  /** Set only when the bake-off is allowed to call a provider. Never a hardcoded blog model. */
  model?: string;
};

export function activePrimaryEngine(): EngineId {
  const raw = process.env.MIDAS_PRIMARY_ENGINE?.trim();
  if (raw === "openai") return "openai";
  return "rules";
}

export function candidateFromEnv(): ModelCandidate {
  const engine = activePrimaryEngine();
  return {
    id: engine === "openai" ? "openai-primary" : "rules-orchestrator",
    engine,
    label: engine === "openai" ? process.env.OPENAI_CHAT_MODEL || "openai (unset model)" : "Rules orchestrator",
    roles: ["primary"],
    model: engine === "openai" ? process.env.OPENAI_CHAT_MODEL : undefined,
  };
}
