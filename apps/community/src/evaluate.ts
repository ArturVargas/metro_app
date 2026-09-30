import {
  evaluate as evaluateWithJev,
  resolveEligible,
  type AttemptResult,
  type EvaluateInput,
  type EvaluateOptions,
  type FeedbackMetadata,
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

  const problemCount = bulletCountBetween(
    text,
    "Problemas prioritarios:",
    "Sugerencias:",
  );
  const suggestionCount = bulletCountBetween(text, "Sugerencias:", "Pregunta:");
  return (
    text.includes(`Puntaje: ${Math.round(score.total)}/100`) &&
    text.includes(
      `Elegibilidad: ${resolveEligible(score) ? "Elegible" : "No elegible"}`,
    ) &&
    text.includes("Fortaleza:") &&
    text.includes("Problemas prioritarios:") &&
    text.includes("Sugerencias:") &&
    text.includes("Pregunta:") &&
    problemCount >= 1 &&
    problemCount <= 2 &&
    suggestionCount === problemCount &&
    !/\b(?:jev|typesafe)\b/i.test(text)
  );
}

function bulletCountBetween(text: string, start: string, end: string): number {
  const section = text.split(start, 2)[1]?.split(end, 1)[0] ?? "";
  return section.split("\n").filter((line) => /^\s*-\s+\S/.test(line)).length;
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
