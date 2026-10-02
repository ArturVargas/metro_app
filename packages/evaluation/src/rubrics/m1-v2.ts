import type { ScoreCriterion, ScoreQuestion } from "../types.js";

/**
 * Mission 1 rubric v2 — prompt-quality Score dimensions against the public brief,
 * with hardened criteria so SOFT failures keep composites below 70 via weights.
 * HARD eligibility fails (force ineligible / cap <70) live in `hard-fail.ts`
 * (ADR-0009), not in these Score weights.
 *
 * Soft (rubric-only): vague "make board nicer" / playable without observables;
 * ambiguous mouse/touch select-connect; incompatible tech / unnecessary deps vs Expo RN.
 * Hard (eligibility policy): missing select+connect, missing visible line, missing
 * web verify <1 min, alters 8 stations, requires demand/passengers/game backend.
 *
 * Expo / React Native mentions remain in-bounds. Weights match m1-v1.
 */
export const RUBRIC_M1_V2_ID = "rubric-m1-v2" as const;

function levels(
  descriptions: [string, string, string, string, string],
): ScoreCriterion[] {
  return descriptions.map((description, level) => ({
    level: level as 0 | 1 | 2 | 3 | 4,
    description,
  }));
}

export const rubricM1V2Questions: ScoreQuestion[] = [
  {
    id: "verifiability",
    kind: "score",
    prompt:
      "How well does the prompt provide observable results and tests so a reviewer can decide whether Mission 1 works (station selection/connection, visible line, web check under one minute)? Soft vagueness without observables must stay low. Hard missing checks are also gated by the eligibility hard-fail policy.",
    weight: 0.3,
    criteria: levels([
      "No observable result or test; reviewer cannot tell if the change worked (e.g. only \"make the board nicer/playable\").",
      "Soft hopes only—playable/nicer tone with no pass/fail observables a reviewer could apply.",
      "At least one observable (select/connect OR visible line OR web check), but incomplete vs the brief; ambiguous mouse/touch flow may still leave pass/fail unclear.",
      "Several observables covering selection/connection and a visible line; reviewer could mostly decide pass/fail; web/<1 min check may be thin.",
      "Clear, observable success/failure tests covering selecting and connecting two stations, a clearly visible line, and confirming in the web build in under one minute.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "actionable-acceptance",
    kind: "score",
    prompt:
      "How much context and instruction does the prompt give an agent so it can change the product for Mission 1 without inventing requirements? Ambiguous mouse/touch select-connect flows must not score high.",
    weight: 0.3,
    criteria: levels([
      "No context or instructions; agent must invent what to change and when it is done.",
      "Goal implied only by genre (e.g. \"make the board playable/nicer\") with no followable change path.",
      "Partial context (fragments of select/connect / visibility / web check) or ambiguous mouse vs touch flow; agent would still invent requirements.",
      "Clear context and instructions aligned with the brief; mouse/touch selection path mostly clear; minor holes remain.",
      "Enough context and instructions for an agent to change the product to select/connect two stations with a visible line and verify in web under one minute—without inventing requirements.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "specificity",
    kind: "score",
    prompt:
      "How specific is the participant prompt about the Mission 1 outcome and inputs? Do not penalize Expo / React Native (they are the project). Penalize contradictory tech or unnecessary dependencies (soft: keep score low). Soft vagueness and ambiguous interaction nouns stay mid/low.",
    weight: 0.25,
    criteria: levels([
      "No concrete outcome or inputs; only a vague wish about the board—or the prompt demands contradictory tech / unnecessary dependencies as the goal.",
      "Outcome hinted (e.g. \"lines\" / \"nicer\") but key nouns/verbs remain ambiguous; or mild tech noise that conflicts with Expo/RN.",
      "Outcome named (select/connect stations / playable board) with some concrete terms; several gaps or ambiguous mouse/touch wording remain; stack coherent if present.",
      "Outcome and main inputs are clear (stations, lines, mouse/touch selection); minor ambiguity left; Expo/RN OK; no contradictory or unnecessary deps as the goal.",
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
      "How clearly does the prompt bound Mission 1 scope (keep 8 stations, no passengers/demand, no game backend)? Actively requiring demand/passengers/backend or altering station count/identity/positions is a HARD eligibility fail (policy), not only a low Score.",
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
