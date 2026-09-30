import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AttemptResult } from "./attempt.js";
import {
  ELIGIBILITY_THRESHOLD,
  attemptTagList,
  buildAttemptTags,
  formatAttemptTagsLine,
  resolveEligible,
  scoreTagValue,
} from "./attempt.js";
import {
  attemptCommentMarker,
  formatAttemptCommentMarkdown,
} from "./comment-format.js";
import type { EvaluationState, ScoreResult } from "./types.js";

function sampleState(overrides: Partial<EvaluationState> = {}): EvaluationState {
  return {
    missionId: "mission-m1",
    rubricVersion: "rubric-m1-v1",
    publicBrief: "Build a station board.",
    participantPrompt: "Create an Expo screen with eight stations.",
    participantId: "p-alpha",
    attempt: 2,
    ...overrides,
  };
}

function sampleScore(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    total: 72.5,
    eligible: null,
    rubricVersion: "rubric-m1-v1",
    notes: "test",
    dimensions: [
      {
        questionId: "specificity",
        level: 3,
        normalized: 0.75,
        weight: 0.25,
      },
      {
        questionId: "verifiability",
        level: 2,
        normalized: 0.5,
        weight: 0.3,
      },
    ],
    routing: {
      action: "caution",
      confidenceSummary: "medium",
      probabilitySummary: null,
    },
    ...overrides,
  };
}

function sampleAttempt(
  overrides: Partial<AttemptResult> = {},
): AttemptResult {
  return {
    state: sampleState(),
    score: sampleScore(),
    feedback: "Clarify acceptance criteria for the station list.",
    ...overrides,
  };
}

describe("resolveEligible / scoreTagValue", () => {
  it("uses explicit eligible when set", () => {
    assert.equal(resolveEligible({ total: 10, eligible: true }), true);
    assert.equal(resolveEligible({ total: 90, eligible: false }), false);
  });

  it("applies threshold when eligible is null", () => {
    assert.equal(resolveEligible({ total: 70, eligible: null }), true);
    assert.equal(resolveEligible({ total: 69.9, eligible: null }), false);
    assert.equal(ELIGIBILITY_THRESHOLD, 70);
  });

  it("rounds score tag to integer 0–100", () => {
    assert.equal(scoreTagValue(72.5), 73);
    assert.equal(scoreTagValue(-1), 0);
    assert.equal(scoreTagValue(100.4), 100);
  });
});

describe("buildAttemptTags", () => {
  it("produces stable tag strings", () => {
    const tags = buildAttemptTags(sampleAttempt());
    assert.deepEqual(tags, {
      attempt: "attempt:2",
      score: "score:73",
      routing: "routing:caution",
      eligible: "eligible:yes",
    });
    assert.equal(
      formatAttemptTagsLine(sampleAttempt()),
      "attempt:2 score:73 routing:caution eligible:yes",
    );
    assert.deepEqual(attemptTagList(sampleAttempt()), [
      "attempt:2",
      "score:73",
      "routing:caution",
      "eligible:yes",
    ]);
  });

  it("marks ineligible below threshold", () => {
    const tags = buildAttemptTags(
      sampleAttempt({
        score: sampleScore({ total: 55, eligible: null, routing: {
          action: "defer",
          confidenceSummary: "low",
          probabilitySummary: null,
        }}),
      }),
    );
    assert.equal(tags.eligible, "eligible:no");
    assert.equal(tags.routing, "routing:defer");
    assert.equal(tags.score, "score:55");
  });
});

describe("formatAttemptCommentMarkdown", () => {
  it("includes prompt, score, dimensions, feedback, tags, and marker", () => {
    const md = formatAttemptCommentMarkdown(sampleAttempt());
    assert.match(md, /<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:2 -->/);
    assert.match(md, /## Evaluation attempt 2/);
    assert.match(md, /Create an Expo screen with eight stations/);
    assert.match(md, /\*\*Total:\*\* 73 \/ 100/);
    assert.match(md, /specificity/);
    assert.match(md, /Clarify acceptance criteria/);
    assert.match(md, /attempt:2 score:73 routing:caution eligible:yes/);
    assert.doesNotMatch(md, /Jev/i);
  });

  it("exposes marker helper", () => {
    assert.equal(
      attemptCommentMarker(sampleAttempt()),
      "<!-- metro-attempt: mission:mission-m1 participant:p-alpha attempt:2 -->",
    );
  });
});
