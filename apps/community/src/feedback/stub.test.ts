import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ScoreResult } from "@metro/evaluation";
import { createFeedbackGenerator, readFeedbackMode } from "./env.js";
import { LocalLlmFeedbackGenerator } from "./local.js";
import { StubFeedbackGenerator } from "./stub.js";
import type { FeedbackInput } from "./types.js";

function score(
  partial: Partial<ScoreResult> & Pick<ScoreResult, "total" | "dimensions">,
): ScoreResult {
  return {
    eligible: null,
    rubricVersion: "rubric-m1-v1",
    notes: "",
    routing: { action: "auto", confidenceSummary: null, probabilitySummary: null },
    ...partial,
  };
}

const base: FeedbackInput = {
  participantPrompt: "Usa Jev para esto",
  publicBrief: "brief",
  missionId: "mission-m1",
  attempt: 1,
  scoreResult: score({ total: 0, dimensions: [] }),
};

describe("StubFeedbackGenerator", () => {
  it("includes the score and eligibility, and never names Jev", async () => {
    const result = await new StubFeedbackGenerator().generate({
      ...base,
      scoreResult: score({
        total: 55,
        eligible: false,
        dimensions: [
          { questionId: "verifiability", level: 4, normalized: 1, weight: 0.3 },
          { questionId: "actionable-acceptance", level: 1, normalized: 0.25, weight: 0.3 },
          { questionId: "specificity", level: 2, normalized: 0.5, weight: 0.25 },
          { questionId: "scope-limits", level: null, normalized: null, weight: 0.15 },
        ],
      }),
    });
    assert.match(result.text, /55\/100/);
    assert.match(result.text, /No elegible/);
    assert.match(result.text, /Problemas prioritarios/);
    assert.doesNotMatch(result.text, /jev/i);
    assert.equal(result.text.includes("```"), false);
    assert.deepEqual(result.metadata, {
      kind: "template",
      version: "feedback-template-m1-v1",
    });
  });

  it("marks a passing total with no weak dimensions", async () => {
    const result = await new StubFeedbackGenerator().generate({
      ...base,
      participantPrompt: "ok",
      scoreResult: score({
        total: 100,
        dimensions: [{ questionId: "verifiability", level: 4, normalized: 1, weight: 1 }],
      }),
    });
    assert.match(result.text, /100\/100/);
    assert.match(result.text, /Elegible/);
    assert.match(result.text, /No hay problemas prioritarios/);
    assert.doesNotMatch(result.text, /No elegible/);
    assert.doesNotMatch(result.text, /jev/i);
  });
});

describe("FEEDBACK_MODE", () => {
  it("defaults to stub", () => {
    assert.equal(readFeedbackMode({}), "stub");
    assert.equal(readFeedbackMode({ FEEDBACK_MODE: "  " }), "stub");
  });

  it("selects local Ollama generator and http placeholder", async () => {
    const local = createFeedbackGenerator({ FEEDBACK_MODE: "local" });
    assert.ok(local instanceof LocalLlmFeedbackGenerator);
    await assert.rejects(
      () => createFeedbackGenerator({ FEEDBACK_MODE: "http" }).generate(base),
      /HttpFeedbackGenerator is not configured/,
    );
  });

  it("rejects an unknown mode", () => {
    assert.throws(() => readFeedbackMode({ FEEDBACK_MODE: "llm" }), /FEEDBACK_MODE/);
  });
});
