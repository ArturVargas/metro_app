/**
 * GitHubIssueStore: one Issue per (missionId × participantId); each attempt is a comment.
 * Prefer typed Octokit. No Jev / Hermes / LLM calls.
 */

import { Octokit } from "@octokit/rest";
import {
  buildAttemptTags,
  formatAttemptCommentMarkdown,
  type AttemptResult,
} from "@metro/evaluation";
import type { GitHubStoreConfig } from "./config.js";
import { assertNextAttempt } from "./attempt-sequence.js";
import {
  buildIssueBody,
  buildIssueTitle,
  issueBodyMarker,
  latestAttemptLabels,
  missionKey,
  participantKey,
} from "./markers.js";

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
    const issue = await this.findOrCreateIssue(missionId, participantId);
    const bodies: string[] = [];
    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.issues.listComments,
      {
        owner: this.owner,
        repo: this.repo,
        issue_number: issue.number,
        per_page: 100,
      },
    )) {
      for (const comment of response.data) bodies.push(comment.body ?? "");
    }
    assertNextAttempt(bodies, missionId, participantId, attempt);
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
    await this.assertAttemptAllowed(
      missionId,
      participantId,
      attempt.state.attempt,
    );
    const issue = await this.findOrCreateIssue(missionId, participantId);
    const body = formatAttemptCommentMarkdown(attempt);

    const { data: comment } = await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issue.number,
      body,
    });

    await this.syncLatestLabels(issue.number, attempt);

    return {
      ...attempt,
      githubIssueUrl: issue.htmlUrl,
      githubCommentUrl: comment.html_url,
      issueNumber: issue.number,
    };
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
