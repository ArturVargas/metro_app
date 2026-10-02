import { ELIGIBILITY_THRESHOLD, type AttemptResult, type FeedbackMetadata } from "./attempt.js";
import { buildTemplateFeedback } from "./feedback-template.js";
import {
  applyHardFailPolicy,
  detectM1V2HardFails,
  type HardFailId,
} from "./hard-fail.js";
import { createJevClient } from "./jev/env.js";
import { decisionsToScoreAnswers, rubricToJevQuestions } from "./jev/map.js";
import type { JevClient } from "./jev/types.js";
import { RUBRIC_M1_V1_ID, rubricM1V1Questions } from "./rubrics/m1-v1.js";
import { RUBRIC_M1_V2_ID, rubricM1V2Questions } from "./rubrics/m1-v2.js";
import { scoreFromAnswers } from "./score.js";
import type { EvaluationState, ScoreQuestion } from "./types.js";
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
  /** Override hard-fail detection (tests). When omitted, m1-v2 detects from the prompt. */
  hardFails?: HardFailId[];
};

const RUBRIC_QUESTIONS: Record<string, ScoreQuestion[]> = {
  [RUBRIC_M1_V1_ID]: rubricM1V1Questions,
  [RUBRIC_M1_V2_ID]: rubricM1V2Questions,
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

function resolveQuestions(rubricVersion: string): ScoreQuestion[] {
  const questions = RUBRIC_QUESTIONS[rubricVersion];
  if (!questions) {
    throw new Error(
      `Unsupported rubricVersion ${rubricVersion}; wired: ${Object.keys(RUBRIC_QUESTIONS).join(", ")}`,
    );
  }
  return questions;
}

export async function evaluate(
  input: EvaluateInput,
  options: EvaluateOptions = {},
): Promise<AttemptResult> {
  const rubricVersion = input.rubricVersion ?? RUBRIC_M1_V2_ID;
  const questions = resolveQuestions(rubricVersion);

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
    questions: rubricToJevQuestions(questions),
  });
  const answers = decisionsToScoreAnswers(questions, evaluation.decisions);
  failValidation(validateAnswersForQuestions(questions, answers));

  let score = scoreFromAnswers(state, answers, questions);

  if (rubricVersion === RUBRIC_M1_V2_ID) {
    const hardFails =
      options.hardFails ?? detectM1V2HardFails(input.participantPrompt);
    score = applyHardFailPolicy(score, hardFails).score;
  } else {
    score.eligible = score.total >= ELIGIBILITY_THRESHOLD;
  }

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
