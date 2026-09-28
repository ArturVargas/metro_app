import type { ScoreCriterion, ScoreQuestion } from "../types.js";

/**
 * Mission 1 rubric v1 — prompt-quality Score dimensions against the public brief
 * (connect stations with lines; playable board). Does NOT encode preferred
 * implementations or stack choices. Weights are authoritative for mission-m1 v1.
 */
export const RUBRIC_M1_V1_ID = "rubric-m1-v1" as const;

function levels(
  descriptions: [string, string, string, string, string],
): ScoreCriterion[] {
  return descriptions.map((description, level) => ({
    level: level as 0 | 1 | 2 | 3 | 4,
    description,
  }));
}

export const rubricM1V1Questions: ScoreQuestion[] = [
  {
    id: "verifiability",
    kind: "score",
    prompt:
      "How well can a reviewer verify success or failure of the Mission 1 outcome (connect stations, visible lines, web demo) from the prompt alone?",
    weight: 0.3,
    criteria: levels([
      "No way to tell whether stations were connected or lines appeared without guessing intent.",
      "Only soft hopes (e.g. \"make it playable\") with no checkable signals from the brief.",
      "At least one checkable signal (e.g. connect two stations OR visible lines OR open web build), but incomplete vs the brief.",
      "Several checkable signals covering connect + visible lines; a reviewer could mostly decide pass/fail; web-demo check may be thin.",
      "Clear, testable success/failure criteria covering connecting stations, clearly visible lines, and confirming in the web build—applicable consistently.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "actionable-acceptance",
    kind: "score",
    prompt:
      "How actionable are the Mission 1 acceptance expectations (ready-when criteria) for an agent executing the prompt?",
    weight: 0.3,
    criteria: levels([
      "No acceptance expectations; agent must invent when connecting stations is done.",
      "Acceptance implied only by genre (e.g. \"make the board playable\") with no ready-when path.",
      "Partial acceptance cues (fragments of connect / visibility / web check) without a followable finish line.",
      "Clear acceptance path aligned with the brief ready-when items; minor holes an agent could still trip on.",
      "Actionable acceptance: agent can follow connect-at-least-two-stations, visible lines, and quick web verification to completion.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "specificity",
    kind: "score",
    prompt:
      "How specific is the participant prompt about the Mission 1 outcome and inputs without imposing a technical stack?",
    weight: 0.25,
    criteria: levels([
      "No concrete outcome or inputs; only a vague wish about the board.",
      "Outcome hinted (e.g. \"lines\") but key nouns/verbs remain ambiguous.",
      "Outcome named (connect stations / playable board) with some concrete terms; several gaps remain.",
      "Outcome and main inputs are clear (stations, lines, player interaction); minor ambiguity left; stack not wrongly prescribed as the goal.",
      "Outcome, inputs, and expected playable artifacts are explicit and unambiguous without mandating a particular implementation stack.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
      { id: "language-barrier", label: "Cannot judge due to unsupported language" },
    ],
  },
  {
    id: "scope-limits",
    kind: "score",
    prompt:
      "How clearly does the prompt bound Mission 1 scope (keep 8 stations, no passengers/demand, no game backend)?",
    weight: 0.15,
    criteria: levels([
      "No scope or limits; passengers, backend, or station redesign could all be in bounds.",
      "Soft preferences without enforceable in/out limits from the brief.",
      "One concrete limit present (e.g. keep stations OR no passengers OR client-only).",
      "Multiple brief limits named (stations identity/count, no demand/passengers, no game backend); a few edge cases still open.",
      "Scope and exclusions are explicit and actionable: preserve the eight stations, stay universal client without game backend, and exclude demand/passenger mechanics.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
];
