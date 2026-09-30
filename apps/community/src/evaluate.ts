import {
  evaluate as evaluateWithJev,
  type AttemptResult,
  type EvaluateInput,
  type JevClient,
} from "@metro/evaluation";
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
};

export async function evaluate(
  input: EvaluateInput,
  options: CommunityEvaluateOptions = {},
): Promise<AttemptResult> {
  const result = await evaluateWithJev(input, {
    client: options.client,
    env: options.env,
    feedback: options.feedback,
  });
  if (!options.record) return result;
  const store =
    options.store ??
    new GitHubIssueStore(requireGitHubStoreConfig(options.env ?? process.env));
  return store.addAttemptComment(result);
}
