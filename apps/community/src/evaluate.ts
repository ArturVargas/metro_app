import {
  evaluate as evaluateWithJev,
  type AttemptResult,
  type EvaluateInput,
  type EvaluateOptions,
  type JevClient,
} from "@metro/evaluation";
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
};

export async function evaluate(
  input: EvaluateInput,
  options: CommunityEvaluateOptions = {},
): Promise<AttemptResult> {
  const store = options.record
    ? options.store ??
      new GitHubIssueStore(requireGitHubStoreConfig(options.env ?? process.env))
    : undefined;
  const runEvaluation = async (): Promise<AttemptResult> => {
    const result = await evaluateWithJev(input, {
      client: options.client,
      env: options.env,
      feedback: options.feedback,
    });
    if (options.record && result.evaluator.provider !== "typesafe") {
      throw new Error("A mock evaluation cannot be recorded");
    }
    return result;
  };
  if (!store) return runEvaluation();
  return store.recordAttempt(input, runEvaluation);
}
