import type { ScoreCriterion, ScoreQuestion } from "../types.js";

export const RUBRIC_M2_V1_ID = "rubric-m2-v1" as const;

function levels(
  descriptions: [string, string, string, string, string],
): ScoreCriterion[] {
  return descriptions.map((description, level) => ({
    level: level as 0 | 1 | 2 | 3 | 4,
    description,
  }));
}

export const rubricM2V1Questions: ScoreQuestion[] = [
  {
    id: "verifiability",
    kind: "score",
    prompt:
      "How well does the prompt define observable checks for Mission 2: assigning a train, seeing it move on open and closed lines, removing or reassigning it, and confirming mouse/touch behavior? Judge only requirements present in the public brief.",
    weight: 0.3,
    criteria: levels([
      "No observable result or test; a reviewer cannot tell whether a train was added or moves.",
      "Mentions moving trains but provides no usable pass/fail checks.",
      "Provides at least one observable check, but leaves important movement or reassignment behavior unverifiable.",
      "Provides clear checks for assignment and movement plus most required states; one relevant path remains thin.",
      "Provides concise pass/fail checks for assignment, open-line and circuit movement, removal/reassignment, and mouse/touch use.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "actionable-acceptance",
    kind: "score",
    prompt:
      "How much context and instruction does the prompt give an agent to implement Mission 2 without inventing the player interaction, train lifecycle, or movement behavior? Judge only requirements present in the public brief.",
    weight: 0.3,
    criteria: levels([
      "No actionable instructions; the agent must invent the feature.",
      "States a broad goal but leaves assignment, movement, and completion undefined.",
      "Describes part of the player flow, but the agent must invent important interaction or lifecycle decisions.",
      "The main player flow and train states are actionable; only minor implementation-facing decisions remain open.",
      "The agent can implement assignment, movement, removal/reassignment, and line-change behavior without inventing product requirements.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
  {
    id: "specificity",
    kind: "score",
    prompt:
      "How precisely does the prompt describe its chosen interaction and visible train behavior for Mission 2? The public brief intentionally leaves presentation and controls open, so reward clear participant decisions rather than any preferred design.",
    weight: 0.25,
    criteria: levels([
      "No concrete player action, train state, or visible result is described.",
      "Names trains or movement but keeps the interaction and result ambiguous.",
      "Makes some concrete choices, while key actions or states still admit conflicting interpretations.",
      "Makes coherent choices for interaction and visible behavior with only minor ambiguity.",
      "Makes concise, unambiguous choices for player controls, train appearance, state changes, and expected movement.",
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
      "How clearly does the prompt preserve the current line-building game and local universal client while excluding passengers, demand, capacity, scoring, collisions, speed controls, pause controls, and a game backend? Judge only limits stated in the public brief.",
    weight: 0.15,
    criteria: levels([
      "No relevant limits; the prompt could replace the current game or add unrelated systems.",
      "Uses vague scope language without protecting the current line-building game.",
      "States at least one concrete boundary, but several public exclusions remain exposed.",
      "Protects the current game and names most relevant exclusions; small scope ambiguity remains.",
      "Clearly preserves current stations and line building, local universal-client state, and excludes all systems outside Mission 2.",
    ]),
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
  },
];
