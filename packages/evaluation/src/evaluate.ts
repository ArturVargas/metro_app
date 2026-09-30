import { ELIGIBILITY_THRESHOLD, type AttemptResult, type FeedbackMetadata } from "./attempt.js";
import { buildTemplateFeedback } from "./feedback-template.js";
import { createJevClient } from "./jev/env.js";
import { decisionsToScoreAnswers, rubricToJevQuestions } from "./jev/map.js";
import type { JevClient } from "./jev/types.js";
import { RUBRIC_M1_V1_ID, rubricM1V1Questions } from "./rubrics/m1-v1.js";
import { scoreFromAnswers } from "./score.js";
import type { EvaluationState } from "./types.js";
import {
  validateAnswersForQuestions,
  validateEvaluationState,
  type ValidationIssue,
} from "./validate.js";

export type EvaluateInput = {
  missionId: string;
  participantId: string;
  participantPrompt: string;
  publicBrief: string;
  attempt: number;
  rubricVersion?: string;
};

export type EvaluateOptions = {
  client?: JevClient;
  env?: NodeJS.ProcessEnv;
  feedback?: { text: string; metadata: FeedbackMetadata };
};

function failValidation(issues: ValidationIssue[]): void {
  if (issues.length === 0) return;
  throw new Error(issues.map((issue) => issue.message).join("; "));
}

function validFeedback(
  feedback: EvaluateOptions["feedback"],
): feedback is NonNullable<EvaluateOptions["feedback"]> {
  if (!feedback?.text.trim() || !feedback.metadata.version.trim()) return false;
  if (feedback.metadata.kind === "llm") {
    return Boolean(feedback.metadata.provider.trim() && feedback.metadata.model.trim());
  }
  return true;
}

export async function evaluate(
  input: EvaluateInput,
  options: EvaluateOptions = {},
): Promise<AttemptResult> {
  const rubricVersion = input.rubricVersion ?? RUBRIC_M1_V1_ID;
  if (rubricVersion !== RUBRIC_M1_V1_ID) {
    throw new Error(
      `Unsupported rubricVersion ${rubricVersion}; only ${RUBRIC_M1_V1_ID} is wired`,
    );
  }

  const state: EvaluationState = {
    missionId: input.missionId,
    rubricVersion,
    publicBrief: input.publicBrief,
    participantPrompt: input.participantPrompt,
    participantId: input.participantId,
    attempt: input.attempt,
  };
  failValidation(validateEvaluationState(state));

  const client = options.client ?? createJevClient(options.env);
  const evaluation = await client.score({
    state: {
      missionId: state.missionId,
      rubricVersion: state.rubricVersion,
      publicBrief: state.publicBrief,
      participantPrompt: state.participantPrompt,
    },
    questions: rubricToJevQuestions(rubricM1V1Questions),
  });
  const answers = decisionsToScoreAnswers(rubricM1V1Questions, evaluation.decisions);
  failValidation(validateAnswersForQuestions(rubricM1V1Questions, answers));

  const score = scoreFromAnswers(state, answers, rubricM1V1Questions);
  score.eligible = score.total >= ELIGIBILITY_THRESHOLD;
  const feedback = validFeedback(options.feedback)
    ? options.feedback
    : buildTemplateFeedback(score);

  return {
    state,
    score,
    evaluator: evaluation.evaluator,
    feedback: feedback.text,
    feedbackMetadata: feedback.metadata,
  };
}
