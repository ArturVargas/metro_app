/**
 * Attempt result contract: evaluation state + score + caller-supplied feedback,
 * plus optional GitHub URLs after persist. Pure types and tag helpers only —
 * no Jev, Hermes, or LLM calls.
 */

import type { EvaluationState, RoutingAction, ScoreResult } from "./types.js";

/** Eligibility threshold for mission attempts (latest attempt only). */
export const ELIGIBILITY_THRESHOLD = 70 as const;

/**
 * Full record of one evaluation attempt ready for GitHub persist.
 * `feedback` is already filled by the caller (LLM or template) — this package
 * does not generate it.
 */
export type AttemptResult = {
  state: EvaluationState;
  score: ScoreResult;
  /** Participant-facing feedback text (never name Jev). */
  feedback: string;
  /** Set after find-or-create / comment persist. */
  githubIssueUrl?: string;
  githubCommentUrl?: string;
};

/** Stable tag strings for comment body and/or issue labels. */
export type AttemptTagSet = {
  attempt: `attempt:${number}`;
  score: `score:${number}`;
  routing: `routing:${RoutingAction}`;
  eligible: "eligible:yes" | "eligible:no";
};

/**
 * Resolve eligibility from ScoreResult.eligible when set; otherwise apply
 * ELIGIBILITY_THRESHOLD to total.
 */
export function resolveEligible(
  score: Pick<ScoreResult, "total" | "eligible">,
  threshold: number = ELIGIBILITY_THRESHOLD,
): boolean {
  if (score.eligible !== null) return score.eligible;
  return score.total >= threshold;
}

/** Rounded integer 0–100 for stable `score:NN` tags. */
export function scoreTagValue(total: number): number {
  return Math.max(0, Math.min(100, Math.round(total)));
}

/**
 * Produce stable tag strings: attempt:N, score:0-100, routing:…, eligible:yes|no.
 */
export function buildAttemptTags(result: AttemptResult): AttemptTagSet {
  const eligible = resolveEligible(result.score);
  return {
    attempt: `attempt:${result.state.attempt}`,
    score: `score:${scoreTagValue(result.score.total)}`,
    routing: `routing:${result.score.routing.action}`,
    eligible: eligible ? "eligible:yes" : "eligible:no",
  };
}

/** Space-separated tag line for comment markdown. */
export function formatAttemptTagsLine(result: AttemptResult): string {
  const t = buildAttemptTags(result);
  return `${t.attempt} ${t.score} ${t.routing} ${t.eligible}`;
}

/** Ordered list of tag strings (useful for label sync). */
export function attemptTagList(result: AttemptResult): string[] {
  const t = buildAttemptTags(result);
  return [t.attempt, t.score, t.routing, t.eligible];
}
