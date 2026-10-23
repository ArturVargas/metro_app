import type { ProjectPromptSnapshot, ProjectQueueSnapshot } from "../project/types.js";
import { GitHubPullRequests, parsePrUrl } from "./github-pr.js";
import { deriveQueueState, queuedAt } from "./queue.js";

export type QueueReader = (snapshot: ProjectPromptSnapshot) => Promise<ProjectQueueSnapshot | undefined>;

export function githubQueueReader(prs: GitHubPullRequests): QueueReader {
  return async (snapshot) => {
    if (!snapshot.pr) return undefined;
    const ref = parsePrUrl(snapshot.pr.prUrl);
    if (!ref) throw new Error(`Issue #${snapshot.issueNumber} has an invalid PR URL`);
    const pr = await prs.get(ref.number);
    const checks = await prs.checks(pr.headSha);
    const state = deriveQueueState({
      prOpen: pr.open,
      headSha: pr.headSha,
      checks: checks.state,
      attemptsUsed: snapshot.attempts,
      latest: { sha: snapshot.pr.evaluatedSha, qualifies: snapshot.pr.qualifies },
      labels: snapshot.pr.labels,
    });
    const passed = snapshot.pr.evaluatedSha === pr.headSha && snapshot.pr.qualifies && checks.state === "success";
    return {
      state,
      headSha: pr.headSha,
      checks: checks.state,
      queuedAt: passed ? queuedAt(snapshot.pr.evaluatedAt, checks.completedAt) : null,
    };
  };
}
