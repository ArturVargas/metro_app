import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ScoreResult } from "@metro/evaluation";
import { createFeedbackGenerator, readFeedbackMode } from "./env.js";
import { LocalLlmFeedbackGenerator } from "./pending.js";
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
    const text = await new StubFeedbackGenerator().generate({
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
    assert.match(text, /55\/100/);
    assert.match(text, /No elegible/);
    assert.match(text, /instrucciones accionables \(1\/4\)/);
    assert.match(text, /especificidad \(2\/4\)/);
    assert.match(text, /límites de alcance/);
    assert.doesNotMatch(text, /verificabilidad/);
    assert.doesNotMatch(text, /jev/i);
    assert.equal(text.includes("```"), false);
  });

  it("marks a passing total with no weak dimensions", async () => {
    const text = await new StubFeedbackGenerator().generate({
      ...base,
      participantPrompt: "ok",
      scoreResult: score({
        total: 100,
        dimensions: [{ questionId: "verifiability", level: 4, normalized: 1, weight: 1 }],
      }),
    });
    assert.match(text, /100\/100/);
    assert.match(text, /Elegible/);
    assert.match(text, /Sin puntos débiles/);
    assert.doesNotMatch(text, /No elegible/);
    assert.doesNotMatch(text, /jev/i);
  });
});

describe("FEEDBACK_MODE", () => {
  it("defaults to stub", () => {
    assert.equal(readFeedbackMode({}), "stub");
    assert.equal(readFeedbackMode({ FEEDBACK_MODE: "  " }), "stub");
  });

  it("selects local and http placeholders that throw not configured", async () => {
    const local = createFeedbackGenerator({ FEEDBACK_MODE: "local" });
    assert.ok(local instanceof LocalLlmFeedbackGenerator);
    await assert.rejects(() => local.generate(base), /LocalLlmFeedbackGenerator is not configured/);
    await assert.rejects(
      () => createFeedbackGenerator({ FEEDBACK_MODE: "http" }).generate(base),
      /HttpFeedbackGenerator is not configured/,
    );
  });

  it("rejects an unknown mode", () => {
    assert.throws(() => readFeedbackMode({ FEEDBACK_MODE: "llm" }), /FEEDBACK_MODE/);
  });
});
