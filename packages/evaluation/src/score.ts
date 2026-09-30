import type {
  Answer,
  ConfidenceBand,
  DimensionScore,
  EvaluationState,
  ProbabilityBand,
  RoutingAction,
  ScoreAnswer,
  ScoreLevel,
  ScoreQuestion,
  ScoreResult,
} from "./types.js";
import { SCORE_LEVEL_MAX } from "./types.js";
import { RUBRIC_V0_ID, rubricV0Questions } from "./rubrics/v0.js";

const CONFIDENCE_RANK: Record<ConfidenceBand, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const PROBABILITY_RANK: Record<ProbabilityBand, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function worstConfidence(bands: ConfidenceBand[]): ConfidenceBand | null {
  if (bands.length === 0) return null;
  return bands.reduce((a, b) =>
    CONFIDENCE_RANK[b] > CONFIDENCE_RANK[a] ? b : a,
  );
}

function worstProbability(bands: ProbabilityBand[]): ProbabilityBand | null {
  if (bands.length === 0) return null;
  return bands.reduce((a, b) =>
    PROBABILITY_RANK[b] > PROBABILITY_RANK[a] ? b : a,
  );
}

function routingFromBands(
  confidence: ConfidenceBand | null,
  probability: ProbabilityBand | null,
): RoutingAction {
  const ranks: number[] = [];
  if (confidence) ranks.push(CONFIDENCE_RANK[confidence]);
  if (probability) ranks.push(PROBABILITY_RANK[probability]);
  if (ranks.length === 0) return "auto";
  const worst = Math.max(...ranks);
  if (worst >= 2) return "defer";
  if (worst >= 1) return "caution";
  return "auto";
}

function isScoreLevel(value: number): value is ScoreLevel {
  return Number.isInteger(value) && value >= 0 && value <= SCORE_LEVEL_MAX;
}

/**
 * Normalize a Score level 0–4 to [0, 1].
 */
export function normalizeScoreLevel(level: ScoreLevel): number {
  return level / SCORE_LEVEL_MAX;
}

/**
 * Convert parallel Score answers into a 0–100 composite.
 * - normalize each level / 4 → 0–1
 * - weighted sum with placeholder equal weights (summing to 1) unless overridden
 * - optional confidence on Choice/Score is routing metadata only
 * Does not call TypeSafe; no secrets.
 */
export function scoreFromAnswers(
  state: EvaluationState,
  answers: Answer[],
  scoreQuestions: ScoreQuestion[] = rubricV0Questions.filter(
    (q): q is ScoreQuestion => q.kind === "score",
  ),
): ScoreResult {
  const answerById = new Map(answers.map((a) => [a.questionId, a]));

  const weightSum = scoreQuestions.reduce((s, q) => s + q.weight, 0);
  const weights =
    weightSum > 0
      ? scoreQuestions.map((q) => q.weight / weightSum)
      : scoreQuestions.map(() => 1 / Math.max(scoreQuestions.length, 1));

  const dimensions: DimensionScore[] = [];
  const confidences: ConfidenceBand[] = [];
  const probabilities: ProbabilityBand[] = [];

  for (const a of answers) {
    if (a.kind === "score" && a.confidence) confidences.push(a.confidence);
    if (a.kind === "choice" && a.confidence) confidences.push(a.confidence);
    if (a.kind === "noul" && a.probabilityBand) {
      probabilities.push(a.probabilityBand);
    }
  }

  let weighted = 0;
  let scoredWeight = 0;

  scoreQuestions.forEach((q, i) => {
    const weight = weights[i] ?? 0;
    const raw = answerById.get(q.id);
    let level: ScoreLevel | null = null;
    let confidence: ConfidenceBand | undefined;

    if (raw && raw.kind === "score") {
      const sa = raw as ScoreAnswer;
      confidence = sa.confidence;
      if (sa.escapeOptionId) {
        level = null;
      } else if (sa.value !== null && isScoreLevel(sa.value)) {
        level = sa.value;
      }
    }

    const normalized = level === null ? null : normalizeScoreLevel(level);
    dimensions.push({
      questionId: q.id,
      level,
      normalized,
      weight,
      confidence,
    });

    if (normalized !== null) {
      weighted += normalized * weight;
      scoredWeight += weight;
    }
  });

  // If some dimensions escaped, renormalize over scored weights so total stays 0–100.
  const composite01 = scoredWeight > 0 ? weighted / scoredWeight : 0;
  const total = Math.round(composite01 * 1000) / 10; // one decimal 0–100

  const confidenceSummary = worstConfidence(confidences);
  const probabilitySummary = worstProbability(probabilities);

  return {
    total,
    eligible: null,
    rubricVersion: state.rubricVersion || RUBRIC_V0_ID,
    notes:
      "Composite Score: normalize level/4 → 0–1, weighted sum → 0–100. " +
      "Mission-versioned weights applied. " +
      "Confidence/probability bands are routing metadata only.",
    dimensions,
    routing: {
      action: routingFromBands(confidenceSummary, probabilitySummary),
      confidenceSummary,
      probabilitySummary,
    },
  };
}
