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
import { RUBRIC_M2_V1_ID, rubricM2V1Questions } from "./rubrics/m2-v1.js";
import { RUBRIC_M3_V1_ID, rubricM3V1Questions } from "./rubrics/m3-v1.js";
import {
  M3_MAX_DIFF_CHARS,
  applyM3Policy,
  detectM3HardFails,
  type M3HardFailId,
} from "./m3-policy.js";
import { scoreFromAnswers } from "./score.js";
import type { CodeSubmission, EvaluationState, ScoreQuestion } from "./types.js";
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
  submission?: CodeSubmission;
};

export type EvaluateOptions = {
  client?: JevClient;
  env?: NodeJS.ProcessEnv;
  feedback?: { text: string; metadata: FeedbackMetadata };
  /** Override hard-fail detection (tests). When omitted, m1-v2 detects from the prompt. */
  hardFails?: HardFailId[];
  /** Extra M3 hard fails found by the caller, e.g. a stale base. */
  m3HardFails?: M3HardFailId[];
};

const RUBRIC_QUESTIONS: Record<string, ScoreQuestion[]> = {
  [RUBRIC_M1_V1_ID]: rubricM1V1Questions,
  [RUBRIC_M1_V2_ID]: rubricM1V2Questions,
  [RUBRIC_M2_V1_ID]: rubricM2V1Questions,
  [RUBRIC_M3_V1_ID]: rubricM3V1Questions,
};

const PR_MISSIONS = new Set(["mission-m3"]);

function defaultRubricVersion(missionId: string): string {
  if (PR_MISSIONS.has(missionId)) return RUBRIC_M3_V1_ID;
  return missionId === "mission-m2" ? RUBRIC_M2_V1_ID : RUBRIC_M1_V2_ID;
}

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
  const rubricVersion = input.rubricVersion ?? defaultRubricVersion(input.missionId);
  const questions = resolveQuestions(rubricVersion);

  const state: EvaluationState = {
    missionId: input.missionId,
    rubricVersion,
    publicBrief: input.publicBrief,
    participantPrompt: input.participantPrompt,
    participantId: input.participantId,
    attempt: input.attempt,
    ...(input.submission ? { submission: input.submission } : {}),
  };
  failValidation(validateEvaluationState(state));
  const isM3 = rubricVersion === RUBRIC_M3_V1_ID;
  if (isM3 && !state.submission) {
    throw new Error(`${RUBRIC_M3_V1_ID} requires a code submission (PR, SHA and diff)`);
  }
  const m3HardFails =
    isM3 && state.submission
      ? [...detectM3HardFails(state.participantPrompt, state.submission), ...(options.m3HardFails ?? [])]
      : [];

  const client = options.client ?? createJevClient(options.env);
  const evaluation = await client.score({
    state: {
      missionId: state.missionId,
      rubricVersion: state.rubricVersion,
      publicBrief: state.publicBrief,
      participantPrompt: state.participantPrompt,
      ...(isM3 && state.submission ? submissionState(state.submission, m3HardFails) : {}),
    },
    questions: rubricToJevQuestions(questions),
  });
  const answers = decisionsToScoreAnswers(questions, evaluation.decisions);
  failValidation(validateAnswersForQuestions(questions, answers));

  // PR missions weight the unrounded expected level; M1/M2 keep rounded levels.
  let score = scoreFromAnswers(state, answers, questions, { continuous: isM3 });
  let appliedHardFails: string[] = [];

  if (isM3) {
    const applied = applyM3Policy(score, m3HardFails);
    score = applied.score;
    appliedHardFails = applied.hardFails;
  } else if (rubricVersion === RUBRIC_M1_V2_ID) {
    const hardFails =
      options.hardFails ?? detectM1V2HardFails(input.participantPrompt);
    score = applyHardFailPolicy(score, hardFails).score;
  } else {
    score.eligible = score.total >= ELIGIBILITY_THRESHOLD;
  }

  const feedback = validFeedback(options.feedback)
    ? options.feedback
    : buildTemplateFeedback(score, appliedHardFails);

  return {
    state,
    score,
    evaluator: evaluation.evaluator,
    feedback: feedback.text,
    feedbackMetadata: feedback.metadata,
    ...(appliedHardFails.length ? { hardFails: appliedHardFails } : {}),
  };
}

function submissionState(submission: CodeSubmission, hardFails: readonly M3HardFailId[]) {
  const tooLarge = hardFails.includes("diff-too-large");
  return {
    codeDiff: tooLarge ? submission.diff.slice(0, M3_MAX_DIFF_CHARS) : submission.diff,
    declaredTests: submission.declaredTests,
    changeOrigin: submission.changeOrigin,
    changeDeclaration: submission.changeDeclaration,
    headSha: submission.headSha,
    baseSha: submission.baseSha,
  };
}
