import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatAttemptCommentMarkdown, type AttemptResult } from "@metro/evaluation";
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

  it("serializes concurrent fifth-attempt writes across store instances", async () => {
    const bodies = [1, 2, 3, 4].map(
      (number) =>
        `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${number} -->`,
    );
    const octokit = mutableOctokit(bodies);
    const config = { owner: "example", repo: "metro", token: "test" };
    const first = new GitHubIssueStore(config, octokit.client);
    const second = new GitHubIssueStore(config, octokit.client);

    const results = await Promise.all([
      first.addAttemptComment(attempt()),
      second.addAttemptComment(attempt()),
    ]);

    assert.equal(octokit.bodies.length, 5);
    assert.equal(results[0]?.githubCommentUrl, results[1]?.githubCommentUrl);
  });

  it("admits only one concurrent fifth evaluation", async () => {
    const bodies = [1, 2, 3, 4].map(
      (number) =>
        `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${number} -->`,
    );
    const octokit = mutableOctokit(bodies);
    const config = { owner: "example", repo: "metro", token: "test" };
    const stores = [
      new GitHubIssueStore(config, octokit.client),
      new GitHubIssueStore(config, octokit.client),
    ];
    let evaluations = 0;
    const input = attempt().state;

    const results = await Promise.allSettled(
      stores.map((store) =>
        store.recordAttempt(input, async () => {
          evaluations += 1;
          return attempt();
        }),
      ),
    );

    assert.equal(evaluations, 1);
    assert.equal(octokit.bodies.length, 5);
    assert.deepEqual(
      results.map((result) => result.status).sort(),
      ["fulfilled", "rejected"],
    );
  });

  it("retries after an uncertain comment response without duplicating the attempt", async () => {
    const bodies = [1, 2, 3, 4].map(
      (number) =>
        `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${number} -->`,
    );
    const octokit = mutableOctokit(bodies, { failAfterFirstComment: true });
    const store = new GitHubIssueStore(
      { owner: "example", repo: "metro", token: "test" },
      octokit.client,
    );

    await assert.rejects(() => store.addAttemptComment(attempt()), /connection lost/);
    const retried = await store.addAttemptComment(attempt());

    assert.equal(octokit.bodies.length, 5);
    assert.match(retried.githubCommentUrl, /issuecomment-5/);
  });

  it("does not roll latest labels back when an older exact attempt is retried", async () => {
    const older = attempt();
    older.state.attempt = 4;
    const bodies = [
      ...[1, 2, 3].map(
        (number) =>
          `<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:${number} -->`,
      ),
      formatAttemptCommentMarkdown(older),
      "<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:5 -->",
    ];
    const octokit = mutableOctokit(bodies);
    const store = new GitHubIssueStore(
      { owner: "example", repo: "metro", token: "test" },
      octokit.client,
    );

    await store.addAttemptComment(older);

    assert.equal(octokit.labelWrites.length, 0);
  });
});

function mutableOctokit(
  initialBodies: string[],
  options: { failAfterFirstComment?: boolean } = {},
): { client: Octokit; bodies: string[]; labelWrites: string[][] } {
  const bodies = [...initialBodies];
  const labelWrites: string[][] = [];
  let failAfterFirstComment = options.failAfterFirstComment ?? false;
  const issueBody =
    "<!-- metro-issue: mission:mission-m1 participant:p-alpha -->\nmission:mission-m1\nparticipant:p-alpha";
  const issues = {
    listComments() {},
    async createComment(input: { body: string }) {
      bodies.push(input.body);
      if (failAfterFirstComment) {
        failAfterFirstComment = false;
        throw new Error("connection lost after comment creation");
      }
      return {
        data: {
          html_url: `https://github.com/example/issues/7#issuecomment-${bodies.length}`,
        },
      };
    },
    async getLabel() {
      return { data: {} };
    },
    async get() {
      return { data: { labels: [] } };
    },
    async setLabels(input: { labels: string[] }) {
      labelWrites.push(input.labels);
      return { data: [] };
    },
  };
  const client = {
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
      issues,
    },
    paginate: {
      async *iterator(method: unknown) {
        if (method === issues.listComments) {
          yield {
            data: bodies.map((body, index) => ({
              body,
              html_url: `https://github.com/example/issues/7#issuecomment-${index + 1}`,
            })),
          };
        }
      },
    },
  } as unknown as Octokit;
  return { client, bodies, labelWrites };
}
