import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MockJevClient, type AttemptResult } from "@metro/evaluation";
import { evaluate } from "./evaluate.js";

const input = {
  missionId: "mission-m1",
  participantId: "p-alpha",
  publicBrief: "brief",
  participantPrompt: "hello",
  attempt: 1,
};

describe("community evaluate", () => {
  it("fills stub feedback and does not touch the store unless record", async () => {
    let called = false;
    const result = await evaluate(input, {
      client: new MockJevClient({
        levels: {
          verifiability: 3,
          "actionable-acceptance": 3,
          specificity: 3,
          "scope-limits": 3,
        },
      }),
      record: false,
      store: {
        async addAttemptComment() {
          called = true;
          return input as unknown as AttemptResult;
        },
      },
    });
    assert.equal(called, false);
    assert.match(result.feedback, /75\/100/);
    assert.match(result.feedback, /Elegible/);
    assert.doesNotMatch(result.feedback, /jev/i);
    assert.equal(result.score.rubricVersion, "rubric-m1-v1");
  });

  it("persists feedback already filled", async () => {
    let seen = "";
    const result = await evaluate(input, {
      client: new MockJevClient(),
      record: true,
      store: {
        async addAttemptComment(attempt) {
          seen = attempt.feedback;
          return {
            ...attempt,
            githubIssueUrl: "https://github.com/example/issues/7",
            githubCommentUrl: "https://github.com/example/issues/7#issuecomment-1",
          };
        },
      },
    });
    assert.equal(result.githubIssueUrl, "https://github.com/example/issues/7");
    assert.equal(result.feedback, seen);
    assert.match(seen, /0\/100/);
    assert.doesNotMatch(seen, /jev/i);
  });

  it("keeps an explicit feedback string", async () => {
    const result = await evaluate(input, {
      client: new MockJevClient(),
      feedback: "texto fijo",
    });
    assert.equal(result.feedback, "texto fijo");
  });

  it("requires a token when recording without an injected store", async () => {
    await assert.rejects(
      () =>
        evaluate(input, {
          client: new MockJevClient(),
          record: true,
          env: {},
        }),
      /GITHUB_TOKEN/,
    );
  });
});
