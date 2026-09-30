import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluate } from "./evaluate.js";
import { MockJevClient } from "./jev/mock.js";

const input = {
  missionId: "mission-m1",
  participantId: "p-alpha",
  publicBrief: "Select and connect stations with a visible line.",
  participantPrompt:
    "Build an Expo screen: select and connect eight stations with a visible line. Verify in the web build. Keep the eight stations. No passengers, no demand, no backend.",
  attempt: 1,
};

describe("evaluate", () => {
  it("returns eligibility, fallback feedback, and evaluator provenance", async () => {
    const result = await evaluate(input, { client: new MockJevClient() });
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
    assert.equal(result.score.rubricVersion, "rubric-m1-v1");
    assert.match(result.score.notes, /Mission-versioned weights applied/);
    assert.doesNotMatch(result.score.notes, /Placeholder equal weights/);
    assert.equal(result.score.routing.action, "auto");
    assert.equal(result.score.routing.confidenceSummary, "high");
    assert.deepEqual(
      result.score.dimensions.map((d) => d.level),
      [4, 4, 4, 4],
    );
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
    });
    assert.equal(result.score.total, 0);
    assert.match(result.feedback, /Fortaleza: No se identificó una fortaleza concreta/);
    assert.doesNotMatch(result.feedback, /propone resultados que pueden comprobarse/);
  });

  it("rejects an unsupported rubric and an invalid attempt", async () => {
    await assert.rejects(
      () => evaluate({ ...input, rubricVersion: "v0" }, { client: new MockJevClient() }),
      /rubric-m1-v1/,
    );
    await assert.rejects(
      () => evaluate({ ...input, attempt: 6 }, { client: new MockJevClient() }),
      /exceeds max/,
    );
  });
});
