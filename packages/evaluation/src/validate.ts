import type { Answer, EvaluationState, Question } from "./types.js";
import { MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT } from "./types.js";

export type ValidationIssue = {
  code: string;
  message: string;
};

export function validateEvaluationState(
  state: EvaluationState,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!state.missionId.trim()) {
    issues.push({ code: "mission_id_required", message: "missionId is required" });
  }
  if (!state.rubricVersion.trim()) {
    issues.push({
      code: "rubric_version_required",
      message: "rubricVersion is required",
    });
  }
  if (!state.publicBrief.trim()) {
    issues.push({
      code: "public_brief_required",
      message: "publicBrief is required",
    });
  }
  if (!state.participantPrompt.trim()) {
    issues.push({
      code: "participant_prompt_required",
      message: "participantPrompt is required",
    });
  }
  if (!state.participantId.trim()) {
    issues.push({
      code: "participant_id_required",
      message: "participantId is required",
    });
  }
  if (!Number.isInteger(state.attempt) || state.attempt < 1) {
    issues.push({
      code: "attempt_invalid",
      message: "attempt must be an integer >= 1",
    });
  } else if (state.attempt > MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT) {
    issues.push({
      code: "attempt_exceeded",
      message:
        `attempt exceeds max ${MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT} evaluaciones por misión por participante`,
    });
  }
  return issues;
}

export function validateAnswersForQuestions(
  questions: Question[],
  answers: Answer[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  for (const q of questions) {
    if (!byId.has(q.id)) {
      issues.push({
        code: "answer_missing",
        message: `Missing answer for question ${q.id}`,
      });
      continue;
    }
    const a = byId.get(q.id)!;
    if (a.kind !== q.kind) {
      issues.push({
        code: "kind_mismatch",
        message: `Answer kind ${a.kind} does not match question ${q.id} kind ${q.kind}`,
      });
    }
    if (q.kind === "score" && a.kind === "score" && a.value !== null) {
      if (!Number.isInteger(a.value) || a.value < 0 || a.value > 4) {
        issues.push({
          code: "score_level_invalid",
          message: `Score answer for ${q.id} must be integer 0–4 or null`,
        });
      }
    }
    if (q.kind === "score" && q.criteria.length !== 5) {
      issues.push({
        code: "score_criteria_count",
        message: `Score question ${q.id} must define exactly 5 situational levels`,
      });
    }
  }
  for (const a of answers) {
    if (!questions.some((q) => q.id === a.questionId)) {
      issues.push({
        code: "unknown_question",
        message: `Answer references unknown question ${a.questionId}`,
      });
    }
  }
  return issues;
}
