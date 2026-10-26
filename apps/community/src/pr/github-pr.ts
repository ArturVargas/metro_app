import { M3_MAX_DIFF_CHARS } from "@metro/evaluation";
import { Octokit } from "@octokit/rest";
import type { GitHubStoreConfig } from "../github/config.js";
import {
  type DiffContextReport,
  MAX_WIDENED_FILES,
  PR_DIFF_CONTEXT_LINES,
  widenablePaths,
  widenDiffContext,
} from "./diff-context.js";
import type { ChecksState } from "./queue.js";

/** Pauses between tries when GitHub fails to return a base file (rate limit, 5xx, network). */
export const BASE_FILE_RETRY_DELAYS_MS: readonly number[] = [1_000, 3_000];

export type PrDiff = { diff: string; mergeBase: string; context: DiffContextReport };

export type GitHubPullRequestsOptions = {
  retryDelaysMs?: readonly number[];
  sleep?: (ms: number) => Promise<void>;
  log?: (line: string) => void;
};

/** Transient GitHub failures worth retrying: no HTTP status (network), 429, 403 rate limit, 5xx. */
function isTransient(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status !== "number") return true;
  return status === 429 || status === 403 || status >= 500;
}

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
  private readonly retryDelaysMs: readonly number[];
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly log: (line: string) => void;

  constructor(
    private readonly config: GitHubStoreConfig,
    octokit?: Octokit,
    options: GitHubPullRequestsOptions = {},
  ) {
    this.octokit = octokit ?? new Octokit({ auth: config.token, userAgent: "metro-community-pr-reader" });
    this.retryDelaysMs = options.retryDelaysMs ?? BASE_FILE_RETRY_DELAYS_MS;
    this.sleep = options.sleep ?? ((ms) => new Promise((done) => setTimeout(done, ms)));
    this.log = options.log ?? ((line) => console.error(line));
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
   * Context is widened to PR_DIFF_CONTEXT_LINES using the base files. The only exceptions
   * keep GitHub's 3-line diff on purpose and say so in `context`: more than
   * MAX_WIDENED_FILES base files, or a widened diff above M3_MAX_DIFF_CHARS. A base file that
   * still fails after retries makes `context.status` "incomplete"; callers must not evaluate.
   */
  async diffFromBase(baseSha: string, headSha: string): Promise<PrDiff> {
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
    const mergeBase = data.merge_base_commit.sha;
    const paths = widenablePaths(diff);

    if (paths.length > MAX_WIDENED_FILES) {
      return this.fallback(diff, mergeBase, paths.length, "too-many-files");
    }
    const { content, missing } = await this.baseFiles(paths, baseSha);
    if (missing.length > 0) {
      this.log(`diff context incomplete: ${missing.length} base file(s) could not be fetched`);
      return { diff, mergeBase, context: { status: "incomplete", missing } };
    }
    const widened = widenDiffContext(diff, content);
    if (widened.length > M3_MAX_DIFF_CHARS) {
      return this.fallback(diff, mergeBase, paths.length, "diff-too-large");
    }
    return {
      diff: widened,
      mergeBase,
      context: { status: "widened", contextLines: PR_DIFF_CONTEXT_LINES, files: paths.length },
    };
  }

  private fallback(
    diff: string,
    mergeBase: string,
    files: number,
    reason: "diff-too-large" | "too-many-files",
  ): PrDiff {
    this.log(`diff context fallback: ${reason} (${files} base files); evaluating GitHub's 3-line diff`);
    return { diff, mergeBase, context: { status: "fallback", contextLines: 3, files, reason } };
  }

  /** Raw base-side content of `paths`, retrying transient failures; failures are listed in `missing`. */
  private async baseFiles(
    paths: readonly string[],
    baseSha: string,
  ): Promise<{ content: Map<string, string>; missing: string[] }> {
    const content = new Map<string, string>();
    const missing: string[] = [];
    for (const path of paths) {
      const text = await this.baseFile(path, baseSha);
      if (text === null) missing.push(path);
      else content.set(path, text);
    }
    return { content, missing };
  }

  private async baseFile(path: string, baseSha: string): Promise<string | null> {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path,
          ref: baseSha,
          mediaType: { format: "raw" },
        });
        return typeof response.data === "string" ? response.data : null;
      } catch (error) {
        const delay = this.retryDelaysMs[attempt];
        if (delay === undefined || !isTransient(error)) return null;
        await this.sleep(delay);
      }
    }
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
