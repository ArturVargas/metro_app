import type { ConfidenceBand, ScoreAnswer, ScoreLevel, ScoreQuestion } from "../types.js";
import { SCORE_LEVEL_MAX } from "../types.js";
import type { JevScoreDecision, JevScoreQuestionPayload } from "./types.js";

export function rubricToJevQuestions(
  questions: ScoreQuestion[],
): JevScoreQuestionPayload[] {
  return questions.map((q) => ({
    id: q.id,
    instructions: q.prompt,
    criteria: [...q.criteria]
      .sort((a, b) => a.level - b.level)
      .map((c) => c.description),
  }));
}

export function confidenceBand(value: number): ConfidenceBand {
  if (value >= 0.8) return "high";
  if (value >= 0.5) return "medium";
  return "low";
}

export function toScoreLevel(score: number): ScoreLevel {
  if (!Number.isFinite(score)) {
    throw new Error(`Jev score is not a finite number: ${String(score)}`);
  }
  const rounded = Math.round(score);
  const clamped = Math.min(SCORE_LEVEL_MAX, Math.max(0, rounded));
  return clamped as ScoreLevel;
}

export function decisionsToScoreAnswers(
  questions: ScoreQuestion[],
  decisions: JevScoreDecision[],
): ScoreAnswer[] {
  const byId = new Map(decisions.map((d) => [d.questionId, d]));
  return questions.map((q) => {
    const decision = byId.get(q.id);
    if (!decision) {
      throw new Error(`Jev response missing answer for ${q.id}`);
    }
    const confidence =
      decision.confidence === null ? undefined : confidenceBand(decision.confidence);
    if (decision.escapeOptionId || decision.score === null) {
      return {
        questionId: q.id,
        kind: "score",
        value: null,
        escapeOptionId: decision.escapeOptionId,
        confidence,
      };
    }
    return {
      questionId: q.id,
      kind: "score",
      value: toScoreLevel(decision.score),
      confidence,
    };
  });
}
