import {
  LocalLlmFeedbackGenerator,
  readLocalLlmConfig,
} from "./local.js";
import { HttpFeedbackGenerator } from "./pending.js";
import { StubFeedbackGenerator } from "./stub.js";
import type { FeedbackGenerator } from "./types.js";

export type { FeedbackGenerator } from "./types.js";

export type FeedbackMode = "stub" | "local" | "http";

export function readFeedbackMode(env: NodeJS.ProcessEnv = process.env): FeedbackMode {
  const raw = (env.FEEDBACK_MODE ?? "stub").trim().toLowerCase();
  if (raw === "" || raw === "stub") return "stub";
  if (raw === "local" || raw === "http") return raw;
  throw new Error(
    `Unknown FEEDBACK_MODE "${env.FEEDBACK_MODE ?? ""}". Use stub, local, or http.`,
  );
}

export function createFeedbackGenerator(
  env: NodeJS.ProcessEnv = process.env,
): FeedbackGenerator {
  const mode = readFeedbackMode(env);
  if (mode === "stub") return new StubFeedbackGenerator();
  if (mode === "local") return new LocalLlmFeedbackGenerator(readLocalLlmConfig(env));
  return new HttpFeedbackGenerator();
}
