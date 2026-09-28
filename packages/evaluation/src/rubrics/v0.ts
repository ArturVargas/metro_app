import type { ScoreCriterion, ScoreQuestion } from "../types.js";

/**
 * Placeholder rubric v0 — generic prompt-quality Score dimensions only.
 * Intentionally does NOT encode mission solutions or preferred implementations.
 * Weights are equal placeholders (sum = 1); real weights are versioned per mission.
 */
export const RUBRIC_V0_ID = "rubric-v0" as const;

function levels(
  descriptions: [string, string, string, string, string],
): ScoreCriterion[] {
  return descriptions.map((description, level) => ({
    level: level as 0 | 1 | 2 | 3 | 4,
    description,
  }));
}

export const rubricV0Questions: ScoreQuestion[] = [
  {
    id: "specificity",
    kind: "score",
    prompt:
      "How specific is the participant prompt about the desired outcome and inputs?",
    weight: 0.25,
    criteria: levels([
      "No concrete outcome or inputs; only a vague wish.",
      "Outcome hinted but key nouns/verbs remain ambiguous.",
      "Outcome named with some concrete terms; several gaps remain.",
      "Outcome and main inputs are clear; minor ambiguity left.",
      "Outcome, inputs, and expected artifacts are explicit and unambiguous.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
      { id: "language-barrier", label: "Cannot judge due to unsupported language" },
    ],
  },
  {
    id: "verifiability",
    kind: "score",
    prompt:
      "How well can a reviewer verify success or failure from the prompt alone?",
    weight: 0.25,
    criteria: levels([
      "No way to tell success from failure without guessing intent.",
      "Weak signals only (tone or hope); not checkable.",
      "At least one checkable signal, but incomplete.",
      "Several checkable signals; a reviewer could mostly decide pass/fail.",
      "Clear, testable success/failure criteria a reviewer could apply consistently.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "scope-limits",
    kind: "score",
    prompt:
      "How clearly does the prompt bound scope (in/out of bounds, must-not, format)?",
    weight: 0.25,
    criteria: levels([
      "No scope or limits; anything could be in bounds.",
      "Soft preferences without enforceable limits.",
      "One concrete limit (format, files, or must-not) present.",
      "Multiple limits named; a few edge cases still open.",
      "Scope, exclusions, and format constraints are explicit and actionable.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "actionable-acceptance",
    kind: "score",
    prompt:
      "How actionable are the acceptance expectations for an agent executing the prompt?",
    weight: 0.25,
    criteria: levels([
      "No acceptance expectations; agent must invent the finish line.",
      "Acceptance implied only by genre (e.g. \"make it good\").",
      "Partial acceptance cues (steps or checklist fragments).",
      "Clear acceptance path with minor holes an agent could still trip on.",
      "Actionable acceptance: steps or checks an agent can follow to completion.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
];
