import type { Question } from "../types.js";

/**
 * Placeholder rubric v0 — generic prompt-quality criteria only.
 * Intentionally does NOT encode mission solutions or preferred implementations.
 */
export const RUBRIC_V0_ID = "rubric-v0" as const;

export const rubricV0Questions: Question[] = [
  {
    id: "clarity-goal",
    kind: "noul",
    prompt:
      "Does the prompt state a clear, testable goal for what the agent should produce?",
    situationalCriteria: [
      "The goal is explicit, not only implied by tone.",
      "A reviewer could tell success from failure without guessing intent.",
      "Vague wishes without an outcome count as no.",
    ],
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
      { id: "language-barrier", label: "Cannot judge due to unsupported language" },
    ],
    weightHint: 40,
  },
  {
    id: "constraints-named",
    kind: "noul",
    prompt:
      "Does the prompt name at least one concrete constraint (scope, format, or must-not)?",
    situationalCriteria: [
      "Constraints can be format, files in/out of scope, or prohibited changes.",
      "Restating the public brief without adding a constraint counts as no.",
    ],
    escapeOptions: [
      { id: "not-applicable", label: "Prompt is empty or not evaluable" },
    ],
    weightHint: 30,
  },
  {
    id: "audience-fit",
    kind: "choice",
    prompt: "How well does the prompt match the public brief audience and task?",
    situationalCriteria: [
      "Compare only against the public brief, not internal solution preferences.",
      "Prefer evidence in the prompt text over assumed expertise.",
    ],
    options: [
      { id: "aligned", label: "Aligned with brief audience and task" },
      { id: "partial", label: "Partially aligned; gaps or mismatches" },
      { id: "misaligned", label: "Misaligned or contradicts the brief" },
    ],
    escapeOptions: [
      { id: "brief-missing", label: "Public brief missing from evaluation state" },
    ],
    weightHint: 30,
  },
];
