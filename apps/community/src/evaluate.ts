import {
  evaluate as evaluateWithJev,
  type AttemptResult,
  type EvaluateInput,
  type JevClient,
} from "@metro/evaluation";
import { createFeedbackGenerator, type FeedbackGenerator } from "./feedback/env.js";
import { requireGitHubStoreConfig } from "./github/config.js";
import { GitHubIssueStore } from "./github/issue-store.js";

export type RecordStore = {
  addAttemptComment(attempt: AttemptResult): Promise<AttemptResult>;
};

export type CommunityEvaluateOptions = {
  client?: JevClient;
  env?: NodeJS.ProcessEnv;
  record?: boolean;
  store?: RecordStore;
  feedback?: string;
  feedbackGenerator?: FeedbackGenerator;
};

export async function evaluate(
  input: EvaluateInput,
  options: CommunityEvaluateOptions = {},
): Promise<AttemptResult> {
  const scored = await evaluateWithJev(input, {
    client: options.client,
    env: options.env,
  });
  const feedback =
    options.feedback !== undefined
      ? options.feedback
      : await (
          options.feedbackGenerator ?? createFeedbackGenerator(options.env)
        ).generate({
          participantPrompt: input.participantPrompt,
          publicBrief: input.publicBrief,
          scoreResult: scored.score,
          missionId: input.missionId,
          attempt: input.attempt,
        });
  const result: AttemptResult = { ...scored, feedback };
  if (!options.record) return result;
  const store =
    options.store ??
    new GitHubIssueStore(requireGitHubStoreConfig(options.env ?? process.env));
  return store.addAttemptComment(result);
}
