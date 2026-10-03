import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluate } from "./evaluate.js";
import { HARD_FAIL_SCORE_CAP } from "./hard-fail.js";
import { MockJevClient } from "./jev/mock.js";
import { RUBRIC_M1_V1_ID } from "./rubrics/m1-v1.js";
import { RUBRIC_M1_V2_ID } from "./rubrics/m1-v2.js";

const goldenPrompt =
  "Build an Expo screen: select and connect eight stations with a visible line. Verify in the web build. Keep the eight stations. No passengers, no demand, no backend.";

const input = {
  missionId: "mission-m1",
  participantId: "p-alpha",
  publicBrief: "Select and connect stations with a visible line.",
  participantPrompt: goldenPrompt,
  attempt: 1,
};

describe("evaluate", () => {
  it("defaults to rubric-m1-v2 with eligibility and template feedback", async () => {
    const result = await evaluate(input, {
      client: new MockJevClient(),
      hardFails: [],
    });
    assert.match(result.feedback, /Puntaje: 100\/100/);
    assert.match(result.feedback, /Fortaleza:/);
    assert.match(result.feedback, /Pregunta:/);
    assert.doesNotMatch(result.feedback, /Jev/i);
    assert.deepEqual(result.feedbackMetadata, {
      kind: "template",
      version: "feedback-template-m1-v1",
    });
    assert.deepEqual(result.evaluator, {
      provider: "mock",
      requestedModel: "mock-keyword-v1",
      model: "mock-keyword-v1",
    });
    assert.equal(result.score.total, 100);
    assert.equal(result.score.eligible, true);
    assert.equal(result.score.rubricVersion, RUBRIC_M1_V2_ID);
    assert.match(result.score.notes, /Mission-versioned weights applied/);
    assert.doesNotMatch(result.score.notes, /Hard-fail policy/);
    assert.equal(result.score.routing.action, "auto");
    assert.equal(result.score.routing.confidenceSummary, "high");
    assert.deepEqual(
      result.score.dimensions.map((d) => d.level),
      [4, 4, 4, 4],
    );
  });

  it("selects the Mission 2 rubric from the mission id", async () => {
    const result = await evaluate(
      {
        ...input,
        missionId: "mission-m2",
        publicBrief: "Assign a train to a line and show it moving.",
        participantPrompt:
          "Let the player assign one train to each line, see it move, remove it, and verify the result on web and touch.",
      },
      { client: new MockJevClient() },
    );

    assert.equal(result.score.rubricVersion, "rubric-m2-v1");
    assert.deepEqual(
      result.score.dimensions.map((dimension) => dimension.questionId),
      ["verifiability", "actionable-acceptance", "specificity", "scope-limits"],
    );
  });

  it("uses Mission 2 fallback feedback for a weak dimension", async () => {
    const result = await evaluate(
      {
        ...input,
        missionId: "mission-m2",
        publicBrief: "Assign a train to a line and show it moving.",
      },
      {
        client: new MockJevClient({
          levels: {
            verifiability: 4,
            "actionable-acceptance": 4,
            specificity: 4,
            "scope-limits": 0,
          },
        }),
      },
    );

    assert.deepEqual(result.feedbackMetadata, {
      kind: "template",
      version: "feedback-template-m2-v1",
    });
    assert.match(result.feedback, /trenes/i);
  });

  it("applies hard-fail cap and force-ineligible even when Score would pass", async () => {
    const result = await evaluate(input, {
      client: new MockJevClient(),
      hardFails: ["missing-web-verify"],
    });
    assert.equal(result.score.total, HARD_FAIL_SCORE_CAP);
    assert.equal(result.score.eligible, false);
    assert.match(result.score.notes, /missing-web-verify/);
    assert.match(result.feedback, /No elegible/);
  });

  it("detects hard fails from a weak prompt and keeps score ineligible", async () => {
    const result = await evaluate(
      {
        ...input,
        participantPrompt:
          "Haz que el tablero sea más divertido y conecta las estaciones de una manera bonita.",
      },
      {
        client: new MockJevClient({
          levels: {
            verifiability: 1,
            "actionable-acceptance": 1,
            specificity: 0,
            "scope-limits": 0,
          },
        }),
      },
    );
    assert.ok(result.score.total < 70);
    assert.equal(result.score.eligible, false);
    assert.match(result.score.notes, /Hard-fail policy/);
  });

  it("soft vague nicer prompts stay under 70 via rubric without needing hard-fail ids for tech/ambiguity alone", async () => {
    const result = await evaluate(
      {
        ...input,
        participantPrompt:
          "Make the board nicer and more playable somehow with stations.",
      },
      {
        client: new MockJevClient({
          levels: {
            verifiability: 1,
            "actionable-acceptance": 1,
            specificity: 1,
            "scope-limits": 1,
          },
        }),
      },
    );
    assert.ok(result.score.total < 70);
    assert.equal(result.score.eligible, false);
  });

  it("uses injected levels and low confidence for routing only", async () => {
    const result = await evaluate(input, {
      client: new MockJevClient({
        levels: {
          verifiability: 4,
          "actionable-acceptance": 2,
          specificity: 4,
          "scope-limits": 0,
        },
        confidence: 0.2,
      }),
      hardFails: [],
    });
    assert.equal(result.score.total, 70);
    assert.equal(result.score.eligible, true);
    assert.match(result.feedback, /Problemas prioritarios:/);
    assert.match(result.feedback, /Límites de alcance/);
    assert.equal(result.score.routing.action, "defer");
    assert.equal(result.score.routing.confidenceSummary, "low");
    assert.equal(result.state.participantPrompt, input.participantPrompt);
  });

  it("falls back to the versioned template when supplied feedback is invalid", async () => {
    const result = await evaluate(input, {
      client: new MockJevClient(),
      hardFails: [],
      feedback: {
        text: "   ",
        metadata: { kind: "template", version: "" },
      },
    });
    assert.match(result.feedback, /Puntaje: 100\/100/);
    assert.deepEqual(result.feedbackMetadata, {
      kind: "template",
      version: "feedback-template-m1-v1",
    });
  });

  it("does not invent a strength when every dimension scores zero", async () => {
    const result = await evaluate(input, {
      client: new MockJevClient({
        levels: {
          verifiability: 0,
          "actionable-acceptance": 0,
          specificity: 0,
          "scope-limits": 0,
        },
      }),
      hardFails: [],
    });
    assert.equal(result.score.total, 0);
    assert.match(result.feedback, /Fortaleza: No se identificó una fortaleza concreta/);
    assert.doesNotMatch(result.feedback, /propone resultados que pueden comprobarse/);
  });

  it("still supports rubric-m1-v1 without hard-fail policy", async () => {
    const result = await evaluate(
      { ...input, rubricVersion: RUBRIC_M1_V1_ID },
      { client: new MockJevClient(), hardFails: ["missing-web-verify"] },
    );
    assert.equal(result.score.rubricVersion, RUBRIC_M1_V1_ID);
    assert.equal(result.score.total, 100);
    assert.equal(result.score.eligible, true);
    assert.doesNotMatch(result.score.notes, /Hard-fail policy/);
  });

  it("rejects an unsupported rubric and an invalid attempt", async () => {
    await assert.rejects(
      () => evaluate({ ...input, rubricVersion: "v0" }, { client: new MockJevClient() }),
      /rubric-m1-v2/,
    );
    await assert.rejects(
      () => evaluate({ ...input, attempt: 6 }, { client: new MockJevClient() }),
      /exceeds max/,
    );
  });
});
