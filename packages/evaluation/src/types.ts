/**
 * Typed decision kinds mirrored from TypeSafe Jev.
 * Backend/scoring owns 0–100 aggregation; Jev only answers these shapes.
 */
export type QuestionKind = "noul" | "choice" | "score";

export type EscapeOption = {
  id: string;
  label: string;
};

export type ChoiceOption = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  kind: QuestionKind;
  /** Human-readable criterion for reviewers; not shown as a mission solution. */
  prompt: string;
  /** Situational criteria the evaluator should apply. */
  situationalCriteria: string[];
  /** Escape hatches when the prompt cannot be judged on this criterion. */
  escapeOptions?: EscapeOption[];
  /** For choice questions. */
  options?: ChoiceOption[];
  /** Optional weight hint; authoritative weights live in the mission internal contract. */
  weightHint?: number;
};

export type EvaluationState = {
  missionId: string;
  rubricVersion: string;
  /** Public mission brief text (participant-facing). */
  publicBrief: string;
  /** Exact prompt submitted by the participant. */
  participantPrompt: string;
  /** Pseudonymous participant id; never a phone number. */
  participantId: string;
  attempt: number;
};

export type NoulAnswer = {
  questionId: string;
  kind: "noul";
  value: boolean | null;
  escapeOptionId?: string;
};

export type ChoiceAnswer = {
  questionId: string;
  kind: "choice";
  optionId: string | null;
  escapeOptionId?: string;
};

export type ScoreAnswer = {
  questionId: string;
  kind: "score";
  /** Raw Jev score when kind is score; not the final 0–100 mission score. */
  value: number | null;
  escapeOptionId?: string;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type ScoreResult = {
  /** Aggregate 0–100 once the formula is closed; stub may return null. */
  total: number | null;
  eligible: boolean | null;
  rubricVersion: string;
  notes: string;
};
