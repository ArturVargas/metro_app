import { M3_MAX_DIFF_CHARS } from "@metro/evaluation";
import { Octokit } from "@octokit/rest";
import type { GitHubStoreConfig } from "../github/config.js";
import { oldPathOf, splitDiffFiles, widenDiffContext } from "./diff-context.js";
import type { ChecksState } from "./queue.js";

/** At most this many base files are fetched to widen a diff; the rest keep GitHub's context. */
const MAX_WIDENED_FILES = 20;

export type PullRequestInfo = {
  number: number;
  url: string;
  open: boolean;
  baseRef: string;
  baseRepo: string;
  headSha: string;
  body: string;
};

export type ChecksSummary = { state: ChecksState; completedAt: string | null };

/** Check-run names required by ADR-0011; they come from `.github/workflows/participant-pr-checks.yml`. */
export const REQUIRED_CHECKS = ["Lint, typecheck and web build", "PR description"] as const;

const PR_URL = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/pull\/(\d+)\/?$/;

export function parsePrUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.trim().match(PR_URL);
  return match ? { owner: match[1]!, repo: match[2]!, number: Number(match[3]) } : null;
}

export function summarizeChecks(
  runs: Array<{ name: string; status: string; conclusion: string | null; completed_at: string | null }>,
  required: readonly string[] = REQUIRED_CHECKS,
): ChecksSummary {
  let completedAt: string | null = null;
  for (const name of required) {
    const named = runs.filter((run) => run.name === name);
    const latest = named
      .sort((a, b) => (b.completed_at ?? "9").localeCompare(a.completed_at ?? "9"))[0];
    if (!latest || latest.status !== "completed") return { state: "pending", completedAt: null };
    if (latest.conclusion !== "success") return { state: "failure", completedAt: latest.completed_at };
    const firstSuccess = named
      .filter((run) => run.conclusion === "success" && run.completed_at)
      .sort((a, b) => a.completed_at!.localeCompare(b.completed_at!))[0];
    if (firstSuccess?.completed_at && (!completedAt || firstSuccess.completed_at > completedAt)) {
      completedAt = firstSuccess.completed_at;
    }
  }
  return { state: "success", completedAt };
}

export class GitHubPullRequests {
  private readonly octokit: Octokit;

  constructor(private readonly config: GitHubStoreConfig, octokit?: Octokit) {
    this.octokit = octokit ?? new Octokit({ auth: config.token, userAgent: "metro-community-pr-reader" });
  }

  async get(number: number): Promise<PullRequestInfo> {
    const { data } = await this.octokit.rest.pulls.get({
      owner: this.config.owner,
      repo: this.config.repo,
      pull_number: number,
    });
    return {
      number: data.number,
      url: data.html_url,
      open: data.state === "open",
      baseRef: data.base.ref,
      baseRepo: data.base.repo.full_name,
      headSha: data.head.sha,
      body: data.body ?? "",
    };
  }

  /**
   * Diff from the frozen `dev` SHA to the PR head, plus the merge base GitHub computed.
   * Context is widened to PR_DIFF_CONTEXT_LINES using the base files, unless that would
   * exceed M3_MAX_DIFF_CHARS; then GitHub's 3-line diff is returned unchanged.
   */
  async diffFromBase(baseSha: string, headSha: string): Promise<{ diff: string; mergeBase: string }> {
    const params = {
      owner: this.config.owner,
      repo: this.config.repo,
      basehead: `${baseSha}...${headSha}`,
    };
    const { data } = await this.octokit.rest.repos.compareCommitsWithBasehead(params);
    const raw = await this.octokit.rest.repos.compareCommitsWithBasehead({
      ...params,
      mediaType: { format: "diff" },
    });
    const diff = String(raw.data);
    const baseContent = await this.baseFiles(diff, baseSha);
    const widened = widenDiffContext(diff, baseContent);
    return {
      diff: widened.length <= M3_MAX_DIFF_CHARS ? widened : diff,
      mergeBase: data.merge_base_commit.sha,
    };
  }

  /** Raw base-side content of the files a diff modifies; files that fail to load are skipped. */
  private async baseFiles(diff: string, baseSha: string): Promise<Map<string, string>> {
    const paths = [
      ...new Set(
        splitDiffFiles(diff)
          .map(oldPathOf)
          .filter((path): path is string => path !== null),
      ),
    ].slice(0, MAX_WIDENED_FILES);
    const out = new Map<string, string>();
    for (const path of paths) {
      try {
        const response = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path,
          ref: baseSha,
          mediaType: { format: "raw" },
        });
        if (typeof response.data === "string") out.set(path, response.data);
      } catch {
        // Keep GitHub's context for this file.
      }
    }
    return out;
  }

  async checks(sha: string): Promise<ChecksSummary> {
    const { data } = await this.octokit.rest.checks.listForRef({
      owner: this.config.owner,
      repo: this.config.repo,
      ref: sha,
      per_page: 100,
    });
    return summarizeChecks(data.check_runs);
  }
}
