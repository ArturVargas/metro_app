export type {
  Answer,
  ChoiceAnswer,
  ChoiceOption,
  ChoiceQuestion,
  ConfidenceBand,
  DimensionScore,
  EscapeOption,
  EvaluationState,
  NoulAnswer,
  NoulQuestion,
  ProbabilityBand,
  Question,
  QuestionKind,
  RoutingAction,
  ScoreAnswer,
  ScoreCriterion,
  ScoreLevel,
  ScoreQuestion,
  ScoreResult,
} from "./types.js";

export {
  MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT,
  SCORE_LEVEL_MAX,
} from "./types.js";

export type { AttemptResult, AttemptTagSet, FeedbackMetadata } from "./attempt.js";
export {
  ELIGIBILITY_THRESHOLD,
  attemptTagList,
  buildAttemptTags,
  formatAttemptTagsLine,
  resolveEligible,
  scoreTagValue,
} from "./attempt.js";

export {
  attemptCommentMarker,
  formatAttemptCommentMarkdown,
} from "./comment-format.js";

export { RUBRIC_V0_ID, rubricV0Questions } from "./rubrics/v0.js";
export { RUBRIC_M1_V1_ID, rubricM1V1Questions } from "./rubrics/m1-v1.js";
export { RUBRIC_M1_V2_ID, rubricM1V2Questions } from "./rubrics/m1-v2.js";
export type { HardFailId, HardFailApplication } from "./hard-fail.js";
export {
  HARD_FAIL_SCORE_CAP,
  M1_V2_HARD_FAIL_IDS,
  applyHardFailPolicy,
  detectM1V2HardFails,
} from "./hard-fail.js";
export { normalizeScoreLevel, scoreFromAnswers } from "./score.js";
export {
  validateAnswersForQuestions,
  validateEvaluationState,
  type ValidationIssue,
} from "./validate.js";

export type { EvaluateInput, EvaluateOptions } from "./evaluate.js";
export { evaluate } from "./evaluate.js";
export { buildTemplateFeedback, FEEDBACK_TEMPLATE_M1_V1 } from "./feedback-template.js";

export type {
  JevClient,
  JevEvaluationState,
  JevScoreDecision,
  JevScoreResult,
  EvaluatorMetadata,
  JevScoreQuestionPayload,
  JevScoreRequest,
} from "./jev/types.js";
export {
  confidenceBand,
  decisionsToScoreAnswers,
  rubricToJevQuestions,
  toScoreLevel,
} from "./jev/map.js";
export { heuristicScoreLevel, MockJevClient, type MockJevClientOptions } from "./jev/mock.js";
export {
  buildSystemOneBody,
  HttpJevClient,
  systemOneUrl,
  type FetchLike,
  type HttpJevConfig,
} from "./jev/http.js";
export {
  DEFAULT_JEV_BASE_URL,
  DEFAULT_JEV_MODEL,
  createJevClient,
  readHttpJevConfig,
  readJevApiKey,
  readJevMode,
  type JevMode,
} from "./jev/env.js";
