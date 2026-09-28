import type { Answer, EvaluationState, ScoreResult } from "./types.js";
import { RUBRIC_V0_ID } from "./rubrics/v0.js";

/**
 * Stub: convert typed Jev answers into a 0–100 score.
 * Formula and weights remain open (mission internal contract). Do not call TypeSafe here.
 */
export function scoreFromAnswers(
  state: EvaluationState,
  answers: Answer[],
): ScoreResult {
  void answers;
  return {
    total: null,
    eligible: null,
    rubricVersion: state.rubricVersion || RUBRIC_V0_ID,
    notes:
      "scoreFromAnswers is a stub; aggregate formula and eligibility threshold are not implemented yet.",
  };
}
