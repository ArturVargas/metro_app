import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MockJevClient, type AttemptResult, type JevClient } from "@metro/evaluation";
import { evaluate } from "./evaluate.js";

const input = {
  missionId: "mission-m1",
  participantId: "p-alpha",
  publicBrief: "brief",
  participantPrompt: "hello",
  attempt: 1,
};

const liveClient: JevClient = {
  async score(request) {
    return {
      decisions: request.questions.map((question) => ({
        questionId: question.id,
        score: 3,
        confidence: 0.9,
      })),
      evaluator: {
        provider: "typesafe",
        requestedModel: "jev-latest",
        model: "jev-1.13.0",
      },
    };
  },
};

describe("community evaluate", () => {
  it("does not touch the store unless --record", async () => {
    let called = false;
    const result = await evaluate(input, {
      client: new MockJevClient({ levels: { verifiability: 3, "actionable-acceptance": 3, specificity: 3, "scope-limits": 3 } }),
      record: false,
      store: {
        async recordAttempt() {
          called = true;
          return input as unknown as AttemptResult;
        },
      },
    });
    assert.equal(called, false);
    assert.match(result.feedback, /Puntaje:/);
    assert.equal(result.score.rubricVersion, "rubric-m1-v1");
  });

  it("persists when record is set", async () => {
    const result = await evaluate(input, {
      client: liveClient,
      record: true,
      store: {
        async recordAttempt(_input, runEvaluation) {
          const attempt = await runEvaluation();
          return {
            ...attempt,
            githubIssueUrl: "https://github.com/example/issues/7",
            githubCommentUrl: "https://github.com/example/issues/7#issuecomment-1",
          };
        },
      },
    });
    assert.equal(result.githubIssueUrl, "https://github.com/example/issues/7");
    assert.match(result.feedback, /Puntaje:/);
  });

  it("checks the persisted attempt sequence before evaluating", async () => {
    let evaluated = false;
    const client: JevClient = {
      async score() {
        evaluated = true;
        throw new Error("must not evaluate");
      },
    };
    await assert.rejects(
      () =>
        evaluate(input, {
          client,
          record: true,
          store: {
            async recordAttempt() {
              throw new Error("maximum of 5 evaluations reached");
            },
          },
        }),
      /maximum of 5 evaluations/,
    );
    assert.equal(evaluated, false);
  });

  it("never persists a mock evaluation", async () => {
    let persisted = false;
    await assert.rejects(
      () =>
        evaluate(input, {
          client: new MockJevClient(),
          record: true,
          store: {
            async recordAttempt(_input, runEvaluation) {
              const attempt = await runEvaluation();
              persisted = true;
              return attempt;
            },
          },
        }),
      /mock evaluation cannot be recorded/,
    );
    assert.equal(persisted, false);
  });

  it("requires a token when recording without an injected store", async () => {
    await assert.rejects(
      () =>
        evaluate(input, {
          client: liveClient,
          record: true,
          env: {},
        }),
      /GITHUB_TOKEN/,
    );
  });
});
