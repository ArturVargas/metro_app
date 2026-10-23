import { M3_QUALIFICATION_THRESHOLD } from "./rubrics/m3-v1.js";
import type { CodeSubmission, ScoreResult } from "./types.js";

/** Any M3 hard fail caps the total here, which never qualifies (`> 80`). */
export const M3_HARD_FAIL_CAP = M3_QUALIFICATION_THRESHOLD;

/** Diffs above this size are not sent whole; the attempt cannot qualify. */
export const M3_MAX_DIFF_CHARS = 120_000;

export type M3HardFailId =
  | "evaluator-injection"
  | "hidden-text"
  | "protected-path"
  | "empty-diff"
  | "diff-too-large"
  | "core-gap";

export const M3_HARD_FAIL_IDS: readonly M3HardFailId[] = [
  "evaluator-injection",
  "hidden-text",
  "protected-path",
  "empty-diff",
  "diff-too-large",
  "core-gap",
] as const;

export const M3_PROTECTED_PATHS: readonly RegExp[] = [
  /^\.github\//,
  /^apps\/community\//,
  /^packages\/evaluation\//,
  /(^|\/)\.env(\.|$)/,
  /(^|\/)package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^\.nvmrc$/,
];

const INJECTION_PATTERNS: readonly RegExp[] = [
  /\b(?:jev|typesafe)\b/i,
  /\b(?:evaluador|evaluator|grader|calificador|juez|judge|reviewer|revisor|scorer)\b[\s\S]{0,120}\b(?:score|puntaje|puntuaci[oó]n|calific\w*)\b/i,
  /\b(?:ignore|ignora\w*|olvida\w*|disregard|omit[ea]\w*)\b[\s\S]{0,60}\b(?:instruc\w*|r[uú]brica|rubric|reglas|rules|previous|anteriores|criteri\w*)\b/i,
  /\b(?:assign|asign\w*|give|dale|da|pon\w*|set)\b[\s\S]{0,40}\b(?:score|puntaje|nivel|level|calificaci[oó]n|puntuaci[oó]n)\b[\s\S]{0,30}(?:\b4\b|\b100\b|m[aá]xim\w*|\bmax\w*|perfect\w*)/i,
  /\b(?:system prompt|as an ai|you are an? (?:ai|llm|language model)|eres un (?:modelo|asistente|evaluador))\b/i,
];

// Bidi controls can reorder what a reviewer reads; HTML comments vanish when the PR renders.
// Zero-width joiners are not flagged: WhatsApp copy-paste inserts them around bullets.
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/;

/** Changed file paths of a unified diff (`diff --git a/x b/y`). */
export function changedPaths(diff: string): string[] {
  const paths = new Set<string>();
  for (const match of diff.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)) {
    paths.add(match[1]!);
    paths.add(match[2]!);
  }
  return [...paths];
}

/** Only added lines carry participant text; removed lines belong to the baseline. */
export function addedLines(diff: string): string {
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .join("\n");
}

export function detectM3HardFails(
  participantPrompt: string,
  submission: CodeSubmission,
): M3HardFailId[] {
  const fails: M3HardFailId[] = [];
  const added = addedLines(submission.diff);
  const participantText = [
    participantPrompt,
    added,
    submission.declaredTests,
    submission.changeDeclaration,
  ].join("\n");

  if (INJECTION_PATTERNS.some((pattern) => pattern.test(participantText))) {
    fails.push("evaluator-injection");
  }
  if (BIDI_CONTROLS.test(participantPrompt) || participantPrompt.includes("<!--") || BIDI_CONTROLS.test(added)) {
    fails.push("hidden-text");
  }
  if (changedPaths(submission.diff).some((path) => M3_PROTECTED_PATHS.some((rule) => rule.test(path)))) {
    fails.push("protected-path");
  }
  if (!added.trim() && !/^-(?!--)/m.test(submission.diff)) fails.push("empty-diff");
  if (submission.diff.length > M3_MAX_DIFF_CHARS) fails.push("diff-too-large");
  return fails;
}

/** Coverage or fidelity at level 2 or lower means the code does not do what the prompt says. */
export function detectM3CoreGap(score: ScoreResult): M3HardFailId[] {
  const core = score.dimensions.filter(
    (dimension) =>
      dimension.questionId === "requirement-coverage" ||
      dimension.questionId === "behavioral-fidelity",
  );
  return core.some((dimension) => dimension.level === null || dimension.level <= 2)
    ? ["core-gap"]
    : [];
}

export function qualifiesM3(total: number): boolean {
  return total > M3_QUALIFICATION_THRESHOLD;
}

export function applyM3Policy(
  score: ScoreResult,
  hardFails: readonly M3HardFailId[],
): { score: ScoreResult; hardFails: M3HardFailId[] } {
  const unique = [...new Set([...hardFails, ...detectM3CoreGap(score)])];
  if (unique.length === 0) {
    return { score: { ...score, eligible: qualifiesM3(score.total) }, hardFails: [] };
  }
  const total = Math.min(score.total, M3_HARD_FAIL_CAP);
  return {
    score: {
      ...score,
      total,
      eligible: false,
      notes: `${score.notes} M3 policy (${unique.join(", ")}): not qualified, total capped at ${M3_HARD_FAIL_CAP}.`,
    },
    hardFails: unique,
  };
}
