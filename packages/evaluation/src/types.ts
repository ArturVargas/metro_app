/**
 * Typed decision kinds mirrored from TypeSafe Jev.
 * Backend/scoring owns 0–100 aggregation; Jev only answers these shapes.
 */

export type QuestionKind = "noul" | "choice" | "score";

/** Choice/Score confidence bands for routing only (auto / caution / defer). */
export type ConfidenceBand = "high" | "medium" | "low";

/**
 * Noul has no confidence field. Use probability bands for routing instead.
 * Mapping to auto / caution / defer is owned by the orchestrator.
 */
export type ProbabilityBand = "high" | "medium" | "low";

/** Routing action derived from confidence (Choice/Score) or probability (Noul). */
export type RoutingAction = "auto" | "caution" | "defer";

/** Score levels are situational 0–4 (five levels). Normalized as level / 4 → 0–1. */
export type ScoreLevel = 0 | 1 | 2 | 3 | 4;

export const SCORE_LEVEL_MAX = 4 as const;

/** Hard cap: 5 evaluations per mission per participant (not a group/mission total). */
export const MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT = 5 as const;

export type EscapeOption = {
  id: string;
  label: string;
};

export type ChoiceOption = {
  id: string;
  label: string;
};

/** One situational level description for a Score question (not a mission solution hint). */
export type ScoreCriterion = {
  level: ScoreLevel;
  description: string;
};

type QuestionBase = {
  id: string;
  /** Human-readable criterion for reviewers; not shown as a mission solution. */
  prompt: string;
  escapeOptions?: EscapeOption[];
};

export type NoulQuestion = QuestionBase & {
  kind: "noul";
  /** Situational criteria the evaluator should apply. */
  situationalCriteria: string[];
};

export type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  situationalCriteria: string[];
  options: ChoiceOption[];
};

/**
 * Score question: parallel composite dimension with five situational levels (0–4).
 * Authoritative weights are versioned per mission; `weight` here is a placeholder until then.
 */
export type ScoreQuestion = QuestionBase & {
  kind: "score";
  /** Exactly five situational levels, levels 0 through 4. */
  criteria: ScoreCriterion[];
  /** Placeholder weight; mission-versioned weights must sum to 1 across Score dims. */
  weight: number;
};

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type EvaluationState = {
  missionId: string;
  rubricVersion: string;
  /** Public mission brief text (participant-facing). */
  publicBrief: string;
  /** Exact prompt submitted by the participant. */
  participantPrompt: string;
  /** Pseudonymous participant id; never a phone number. */
  participantId: string;
  /**
   * Attempt number for this participant on this mission (1-based).
   * Cap: MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT (5 por misión por participante).
   */
  attempt: number;
};

export type NoulAnswer = {
  questionId: string;
  kind: "noul";
  value: boolean | null;
  escapeOptionId?: string;
  /** Noul has no confidence; optional probability band for routing metadata. */
  probabilityBand?: ProbabilityBand;
};

export type ChoiceAnswer = {
  questionId: string;
  kind: "choice";
  optionId: string | null;
  escapeOptionId?: string;
  /** Optional confidence for routing (auto / caution / defer); does not change score. */
  confidence?: ConfidenceBand;
};

export type ScoreAnswer = {
  questionId: string;
  kind: "score";
  /** Raw Score level 0–4; not the final 0–100 mission score. */
  value: ScoreLevel | null;
  escapeOptionId?: string;
  /** Optional confidence for routing (auto / caution / defer); does not change score. */
  confidence?: ConfidenceBand;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type DimensionScore = {
  questionId: string;
  /** Raw level 0–4, or null if escaped / missing. */
  level: ScoreLevel | null;
  /** Normalized level/4 in [0, 1], or null if not scored. */
  normalized: number | null;
  weight: number;
  confidence?: ConfidenceBand;
};

export type ScoreResult = {
  /** Aggregate 0–100 from weighted normalized Score dimensions. */
  total: number;
  /** Eligibility left to orchestrator threshold (e.g. ≥70); null until wired. */
  eligible: boolean | null;
  rubricVersion: string;
  notes: string;
  dimensions: DimensionScore[];
  /** Routing metadata from confidence/probability bands; does not alter `total`. */
  routing: {
    action: RoutingAction;
    /** Worst (most cautious) Choice/Score confidence seen, if any. */
    confidenceSummary: ConfidenceBand | null;
    /** Worst Noul probability band seen, if any. */
    probabilitySummary: ProbabilityBand | null;
  };
};
