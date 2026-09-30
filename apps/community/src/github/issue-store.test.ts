import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AttemptResult } from "@metro/evaluation";
import type { Octokit } from "@octokit/rest";
import { GitHubIssueStore } from "./issue-store.js";

function attempt(provider: "typesafe" | "mock" = "typesafe"): AttemptResult {
  return {
    state: {
      missionId: "mission-m1",
      rubricVersion: "rubric-m1-v1",
      publicBrief: "brief",
      participantPrompt: "prompt",
      participantId: "p-alpha",
      attempt: 5,
    },
    score: {
      total: 80,
      eligible: true,
      rubricVersion: "rubric-m1-v1",
      notes: "test",
      dimensions: [],
      routing: {
        action: "auto",
        confidenceSummary: "high",
        probabilitySummary: null,
      },
    },
    evaluator: {
      provider,
      requestedModel: provider === "mock" ? "mock-keyword-v1" : "jev-latest",
      model: provider === "mock" ? "mock-keyword-v1" : "jev-1.13.0",
    },
    feedback: "Puntaje: 80/100",
    feedbackMetadata: {
      kind: "template",
      version: "feedback-template-m1-v1",
    },
  };
}

function fakeOctokit(commentBodies: string[]): Octokit {
  const issueBody =
    "<!-- metro-issue: mission:mission-m1 participant:p-alpha -->\nmission:mission-m1\nparticipant:p-alpha";
  const fake = {
    rest: {
      search: {
        async issuesAndPullRequests() {
          return {
            data: {
              items: [
                {
                  number: 7,
                  html_url: "https://github.com/example/issues/7",
                  node_id: "I_7",
                  body: issueBody,
                },
              ],
            },
          };
        },
      },
      issues: {
        listComments() {},
        async createComment() {
          throw new Error("comment was created");
        },
      },
    },
    paginate: {
      async *iterator() {
        yield { data: commentBodies.map((body) => ({ body })) };
      },
    },
  };
  return fake as unknown as Octokit;
}

describe("GitHubIssueStore attempt guards", () => {
  it("rejects a new comment when five attempts already exist", async () => {
    const bodies = [1, 2, 3, 4, 5].map(
      (number) =>
        `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${number} -->`,
    );
    const store = new GitHubIssueStore(
      { owner: "example", repo: "metro", token: "test" },
      fakeOctokit(bodies),
    );
    await assert.rejects(() => store.addAttemptComment(attempt()), /maximum of 5 evaluations/);
  });

  it("rejects mock results without touching GitHub", async () => {
    const store = new GitHubIssueStore(
      { owner: "example", repo: "metro", token: "test" },
      {
        get rest(): never {
          throw new Error("GitHub was touched");
        },
      } as unknown as Octokit,
    );
    await assert.rejects(() => store.addAttemptComment(attempt("mock")), /mock evaluation/);
  });
});
