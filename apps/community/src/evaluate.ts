import {
  evaluate as evaluateWithJev,
  resolveEligible,
  type AttemptResult,
  type EvaluateInput,
  type EvaluateOptions,
  type FeedbackMetadata,
  type HardFailId,
  type JevClient,
  type ScoreResult,
} from "@metro/evaluation";
import { createFeedbackGenerator, type FeedbackGenerator } from "./feedback/env.js";
import type { FeedbackResult } from "./feedback/types.js";
import { requireGitHubStoreConfig } from "./github/config.js";
import { GitHubIssueStore } from "./github/issue-store.js";

export type RecordStore = {
  recordAttempt(
    input: EvaluateInput,
    runEvaluation: () => Promise<AttemptResult>,
  ): Promise<AttemptResult>;
};

export type CommunityEvaluateOptions = {
  client?: JevClient;
  env?: NodeJS.ProcessEnv;
  record?: boolean;
  store?: RecordStore;
  feedback?: EvaluateOptions["feedback"];
  feedbackGenerator?: FeedbackGenerator;
  /** Forwarded to @metro/evaluation hard-fail policy (m1-v2). */
  hardFails?: HardFailId[];
};

function hasValidMetadata(metadata: FeedbackMetadata): boolean {
  if (!metadata.version.trim()) return false;
  if (metadata.kind === "llm") {
    return Boolean(metadata.provider.trim() && metadata.model.trim());
  }
  return true;
}

function isValidGeneratedFeedback(
  feedback: FeedbackResult,
  score: ScoreResult,
): boolean {
  const text = feedback.text.trim();
  if (!text || !hasValidMetadata(feedback.metadata)) return false;
  if (feedback.metadata.kind === "template") return true;

  const lines = text.split("\n");
  const suggestionsAt = lines.indexOf("Sugerencias:");
  const questionAt = lines.findIndex((line) => line.startsWith("Pregunta: "));
  const problems = lines.slice(4, suggestionsAt);
  const suggestions = lines.slice(suggestionsAt + 1, questionAt);
  const isBullet = (line: string) => /^-\s+\S/.test(line);

  return (
    lines[0] === `Puntaje: ${Math.round(score.total)}/100` &&
    lines[1] ===
      `Elegibilidad: ${resolveEligible(score) ? "Elegible" : "No elegible"}` &&
    /^Fortaleza:\s+\S/.test(lines[2] ?? "") &&
    lines[3] === "Problemas prioritarios:" &&
    suggestionsAt >= 5 &&
    questionAt === lines.length - 1 &&
    problems.length >= 1 &&
    problems.length <= 2 &&
    problems.every(isBullet) &&
    suggestions.length === problems.length &&
    suggestions.every(isBullet) &&
    /^Pregunta:\s+\S/.test(lines[questionAt] ?? "") &&
    (text.match(/Puntaje:/g) ?? []).length === 1 &&
    (text.match(/Elegibilidad:/g) ?? []).length === 1 &&
    !/\b(?:jev|typesafe)\b/i.test(text)
  );
}

export async function evaluate(
  input: EvaluateInput,
  options: CommunityEvaluateOptions = {},
): Promise<AttemptResult> {
  const store = options.record
    ? options.store ??
      new GitHubIssueStore(requireGitHubStoreConfig(options.env ?? process.env))
    : undefined;

  const runEvaluation = async (): Promise<AttemptResult> => {
    const scored = await evaluateWithJev(input, {
      client: options.client,
      env: options.env,
      hardFails: options.hardFails,
    });
    if (options.record && scored.evaluator.provider !== "typesafe") {
      throw new Error("A mock evaluation cannot be recorded");
    }

    let feedback = options.feedback;
    if (!feedback) {
      try {
        feedback = await (
          options.feedbackGenerator ?? createFeedbackGenerator(options.env)
        ).generate({
          participantPrompt: input.participantPrompt,
          publicBrief: input.publicBrief,
          scoreResult: scored.score,
          missionId: input.missionId,
          attempt: input.attempt,
        });
      } catch {
        return scored;
      }
    }

    return feedback && isValidGeneratedFeedback(feedback, scored.score)
      ? {
          ...scored,
          feedback: feedback.text.trim(),
          feedbackMetadata: feedback.metadata,
        }
      : scored;
  };

  if (!store) return runEvaluation();
  return store.recordAttempt(input, runEvaluation);
}
