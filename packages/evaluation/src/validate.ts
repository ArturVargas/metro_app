import type { Answer, EvaluationState, Question } from "./types.js";

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
