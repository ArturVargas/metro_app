/**
 * GitHubIssueStore: one Issue per (missionId × participantId); each attempt is a comment.
 * Prefer typed Octokit. No Jev / Hermes / LLM calls.
 */

import { Octokit } from "@octokit/rest";
import {
  buildAttemptTags,
  formatAttemptCommentMarkdown,
  type AttemptResult,
  type EvaluateInput,
} from "@metro/evaluation";
import type { GitHubStoreConfig } from "./config.js";
import {
  assertNextAttempt,
  attemptNumberFromComment,
} from "./attempt-sequence.js";
import {
  buildIssueBody,
  buildIssueTitle,
  issueBodyMarker,
  latestAttemptLabels,
  missionKey,
  parseIssueIdentity,
  participantKey,
} from "./markers.js";
import { latestProjectSnapshot } from "../project/snapshot.js";
import type { ProjectPromptSnapshot } from "../project/types.js";

export type IssueRef = {
  number: number;
  htmlUrl: string;
  nodeId?: string;
};

export type PersistAttemptResult = AttemptResult & {
  githubIssueUrl: string;
  githubCommentUrl: string;
  issueNumber: number;
};

type CommentRef = { body: string; htmlUrl: string };

const attemptLocks = new Map<string, Promise<void>>();

async function withAttemptLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = attemptLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => gate);
  attemptLocks.set(key, tail);
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (attemptLocks.get(key) === tail) attemptLocks.delete(key);
  }
}

export class GitHubIssueStore {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(config: GitHubStoreConfig, octokit?: Octokit) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.octokit =
      octokit ??
      new Octokit({
        auth: config.token,
        userAgent: "metro-community-github-store",
      });
  }

  /**
   * Find an existing issue for (missionId, participantId) via search + marker,
   * or create one with a stable body marker.
   */
  async findOrCreateIssue(
    missionId: string,
    participantId: string,
  ): Promise<IssueRef> {
    const existing = await this.findIssue(missionId, participantId);
    if (existing) return existing;

    const { data } = await this.octokit.rest.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: buildIssueTitle(missionId, participantId),
      body: buildIssueBody(missionId, participantId),
      labels: [missionKey(missionId)],
    });

    return {
      number: data.number,
      htmlUrl: data.html_url,
      nodeId: data.node_id,
    };
  }

  async findIssue(
    missionId: string,
    participantId: string,
  ): Promise<IssueRef | null> {
    const marker = issueBodyMarker(missionId, participantId);
    const q = [
      `repo:${this.owner}/${this.repo}`,
      "is:issue",
      `"${missionKey(missionId)}"`,
      `"${participantKey(participantId)}"`,
    ].join(" ");

    try {
      const { data } = await this.octokit.rest.search.issuesAndPullRequests({
        q,
        per_page: 10,
      });
      for (const item of data.items) {
        if (item.pull_request) continue;
        const body = item.body ?? "";
        if (
          body.includes(marker) ||
          (body.includes(missionKey(missionId)) &&
            body.includes(participantKey(participantId)))
        ) {
          return {
            number: item.number,
            htmlUrl: item.html_url,
            nodeId: item.node_id,
          };
        }
      }
    } catch {
      // Fall through to list+filter when search is unavailable.
    }

    return this.findIssueByList(missionId, participantId, marker);
  }

  async assertAttemptAllowed(
    missionId: string,
    participantId: string,
    attempt: number,
  ): Promise<void> {
    return withAttemptLock(this.lockKey(missionId, participantId), () =>
      this.assertAttemptAllowedUnlocked(missionId, participantId, attempt),
    );
  }

  private async assertAttemptAllowedUnlocked(
    missionId: string,
    participantId: string,
    attempt: number,
  ): Promise<void> {
    const issue = await this.findIssue(missionId, participantId);
    const comments = issue ? await this.listAttemptComments(issue.number) : [];
    assertNextAttempt(
      comments.map((comment) => comment.body),
      missionId,
      participantId,
      attempt,
    );
  }

  private async listAttemptComments(issueNumber: number): Promise<CommentRef[]> {
    const comments: CommentRef[] = [];
    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.issues.listComments,
      {
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        per_page: 100,
      },
    )) {
      for (const comment of response.data) {
        comments.push({ body: comment.body ?? "", htmlUrl: comment.html_url });
      }
    }
    return comments;
  }

  async listOpenProjectSnapshots(): Promise<ProjectPromptSnapshot[]> {
    const snapshots: ProjectPromptSnapshot[] = [];
    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.issues.listForRepo,
      {
        owner: this.owner,
        repo: this.repo,
        state: "open",
        per_page: 100,
      },
    )) {
      for (const issue of response.data) {
        if (issue.pull_request || issue.state !== "open") continue;
        const issueBody = issue.body ?? "";
        if (!parseIssueIdentity(issueBody)) continue;
        const comments = await this.listAttemptComments(issue.number);
        const snapshot = latestProjectSnapshot({
          issueNumber: issue.number,
          issueUrl: issue.html_url,
          issueBody,
          comments: comments.map((comment) => comment.body),
        });
        if (!snapshot) {
          throw new Error(`Issue #${issue.number} has malformed attempt history`);
        }
        snapshots.push(snapshot);
      }
    }
    return snapshots;
  }

  private async findIssueByList(
    missionId: string,
    participantId: string,
    marker: string,
  ): Promise<IssueRef | null> {
    const mKey = missionKey(missionId);
    const pKey = participantKey(participantId);
    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.issues.listForRepo,
      {
        owner: this.owner,
        repo: this.repo,
        state: "all",
        per_page: 100,
      },
    )) {
      for (const issue of response.data) {
        if (issue.pull_request) continue;
        const body = issue.body ?? "";
        if (
          body.includes(marker) ||
          (body.includes(mKey) && body.includes(pKey))
        ) {
          return {
            number: issue.number,
            htmlUrl: issue.html_url,
            nodeId: issue.node_id,
          };
        }
      }
    }
    return null;
  }

  /**
   * Ensure issue exists, post attempt comment, sync labels from latest attempt.
   */
  async addAttemptComment(
    attempt: AttemptResult,
  ): Promise<PersistAttemptResult> {
    if (attempt.evaluator?.provider !== "typesafe") {
      throw new Error("A mock evaluation cannot be recorded");
    }
    const { missionId, participantId } = attempt.state;
    return withAttemptLock(this.lockKey(missionId, participantId), () =>
      this.addAttemptCommentUnlocked(attempt),
    );
  }

  async recordAttempt(
    input: EvaluateInput,
    runEvaluation: () => Promise<AttemptResult>,
  ): Promise<PersistAttemptResult> {
    return withAttemptLock(this.lockKey(input.missionId, input.participantId), async () => {
      await this.assertAttemptAllowedUnlocked(
        input.missionId,
        input.participantId,
        input.attempt,
      );
      const attempt = await runEvaluation();
      if (attempt.evaluator?.provider !== "typesafe") {
        throw new Error("A mock evaluation cannot be recorded");
      }
      return this.addAttemptCommentUnlocked(attempt);
    });
  }

  private async addAttemptCommentUnlocked(
    attempt: AttemptResult,
  ): Promise<PersistAttemptResult> {
    const { missionId, participantId } = attempt.state;
    let issue = await this.findIssue(missionId, participantId);
    let comments = issue ? await this.listAttemptComments(issue.number) : [];
    const body = formatAttemptCommentMarkdown(attempt);
    const exact = comments.find((comment) => comment.body === body);
    if (exact && issue) {
      const hasNewerAttempt = comments.some((comment) => {
        const number = attemptNumberFromComment(
          comment.body,
          missionId,
          participantId,
        );
        return number !== null && number > attempt.state.attempt;
      });
      if (!hasNewerAttempt) await this.syncLatestLabels(issue.number, attempt);
      return {
        ...attempt,
        githubIssueUrl: issue.htmlUrl,
        githubCommentUrl: exact.htmlUrl,
        issueNumber: issue.number,
      };
    }
    assertNextAttempt(
      comments.map((comment) => comment.body),
      missionId,
      participantId,
      attempt.state.attempt,
    );
    issue = issue ?? (await this.findOrCreateIssue(missionId, participantId));

    await this.syncLatestLabels(issue.number, attempt);

    const { data: comment } = await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issue.number,
      body,
    });

    return {
      ...attempt,
      githubIssueUrl: issue.htmlUrl,
      githubCommentUrl: comment.html_url,
      issueNumber: issue.number,
    };
  }

  private lockKey(missionId: string, participantId: string): string {
    // ponytail: process-local serialization is sufficient for the single-writer MVP;
    // move admission to a durable queue/lease before running multiple backend instances.
    return `${this.owner}/${this.repo}/${missionId}/${participantId}`;
  }

  /** Replace managed labels so the issue reflects the latest attempt. */
  async syncLatestLabels(
    issueNumber: number,
    attempt: AttemptResult,
  ): Promise<void> {
    const tags = buildAttemptTags(attempt);
    const desired = latestAttemptLabels({
      missionId: attempt.state.missionId,
      routing: attempt.score.routing.action,
      eligible: tags.eligible,
      attempt: attempt.state.attempt,
    });

    await this.ensureLabelsExist(desired);

    const { data: issue } = await this.octokit.rest.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    const managedPrefixes = [
      "mission:",
      "routing:",
      "eligible:",
      "attempt:",
      "score:",
    ];
    const keep = (issue.labels ?? [])
      .map((l) => (typeof l === "string" ? l : l.name ?? ""))
      .filter((name) => name && !managedPrefixes.some((p) => name.startsWith(p)));

    const next = [...new Set([...keep, ...desired])];

    await this.octokit.rest.issues.setLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: next,
    });
  }

  private async ensureLabelsExist(names: string[]): Promise<void> {
    for (const name of names) {
      try {
        await this.octokit.rest.issues.getLabel({
          owner: this.owner,
          repo: this.repo,
          name,
        });
      } catch {
        try {
          await this.octokit.rest.issues.createLabel({
            owner: this.owner,
            repo: this.repo,
            name,
            color: "0e8a16",
            description: "Metro community attempt metadata",
          });
        } catch {
          // Race or permission — setLabels may still work if label exists.
        }
      }
    }
  }
}
