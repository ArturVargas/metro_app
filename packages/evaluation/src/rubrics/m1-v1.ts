import type { ScoreCriterion, ScoreQuestion } from "../types.js";

/**
 * Mission 1 rubric v1 — prompt-quality Score dimensions against the public brief
 * (select/connect stations with a visible line; playable board). Does NOT encode
 * preferred implementations. Mentions of Expo / React Native are in-bounds (they
 * are the project stack); contradictory tech or unnecessary dependencies may
 * lower specificity. Weights are authoritative for mission-m1 v1.
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
      "How well does the prompt provide observable results and tests so a reviewer can decide whether Mission 1 works (station selection/connection, visible line, web check)?",
    weight: 0.3,
    criteria: levels([
      "No observable result or test; a reviewer cannot tell if the change worked without guessing intent.",
      "Only soft hopes (e.g. \"make it playable\") with no observables a reviewer could apply.",
      "At least one observable signal (e.g. select/connect stations OR a visible line OR a web check), but incomplete vs the brief.",
      "Several observables covering selection/connection and a visible line; a reviewer could mostly decide pass/fail; web check may be thin.",
      "Clear, observable success/failure tests covering selecting and connecting stations, a clearly visible line, and confirming in the web build—applicable consistently.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "actionable-acceptance",
    kind: "score",
    prompt:
      "How much context and instruction does the prompt give an agent so it can change the product for Mission 1 without inventing requirements?",
    weight: 0.3,
    criteria: levels([
      "No context or instructions; agent must invent what to change and when it is done.",
      "Goal implied only by genre (e.g. \"make the board playable\") with no followable change path.",
      "Partial context or instructions (fragments of select/connect / visibility / web check) without enough for an agent to finish without inventing requirements.",
      "Clear context and instructions aligned with the brief; minor holes an agent could still trip on.",
      "Enough context and instructions for an agent to change the product to select/connect stations with a visible line and verify in web—without inventing requirements.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "specificity",
    kind: "score",
    prompt:
      "How specific is the participant prompt about the Mission 1 outcome and inputs? Do not penalize Expo / React Native (they are the project). Penalize contradictory tech or unnecessary dependencies.",
    weight: 0.25,
    criteria: levels([
      "No concrete outcome or inputs; only a vague wish about the board—or the prompt demands contradictory tech / unnecessary dependencies as the goal.",
      "Outcome hinted (e.g. \"lines\") but key nouns/verbs remain ambiguous; or mild tech noise that conflicts with the project.",
      "Outcome named (select/connect stations / playable board) with some concrete terms; several gaps remain; stack mentions are coherent with the project if present.",
      "Outcome and main inputs are clear (stations, lines, mouse/touch selection); minor ambiguity left; Expo/RN mentions OK; no contradictory or unnecessary deps as the goal.",
      "Outcome, inputs, and expected playable artifacts are explicit and unambiguous; Expo/React Native allowed; no contradictory tech or unnecessary dependencies imposed.",
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
