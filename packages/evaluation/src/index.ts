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
  ChangeOrigin,
  CodeSubmission,
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
  submissionMarker,
} from "./comment-format.js";

export { RUBRIC_V0_ID, rubricV0Questions } from "./rubrics/v0.js";
export { RUBRIC_M1_V1_ID, rubricM1V1Questions } from "./rubrics/m1-v1.js";
export { RUBRIC_M1_V2_ID, rubricM1V2Questions } from "./rubrics/m1-v2.js";
export { RUBRIC_M2_V1_ID, rubricM2V1Questions } from "./rubrics/m2-v1.js";
export {
  M3_QUALIFICATION_THRESHOLD,
  RUBRIC_M3_V1_ID,
  rubricM3V1Questions,
} from "./rubrics/m3-v1.js";
export {
  M3_HARD_FAIL_CAP,
  M3_CORE_GAP_LOW_MASS,
  M3_CORE_GAP_TOTAL,
  lowLevelMass,
  M3_HARD_FAIL_IDS,
  M3_MAX_DIFF_CHARS,
  M3_PROTECTED_PATHS,
  addedLines,
  applyM3Policy,
  changedPaths,
  detectM3HardFails,
  qualifiesM3,
  type M3HardFailId,
} from "./m3-policy.js";
export type { HardFailId, HardFailApplication } from "./hard-fail.js";
export {
  HARD_FAIL_SCORE_CAP,
  M1_V2_HARD_FAIL_IDS,
  applyHardFailPolicy,
  detectM1V2HardFails,
} from "./hard-fail.js";
export { normalizeScoreLevel, scoreFromAnswers, type ScoreOptions } from "./score.js";
export {
  validateAnswersForQuestions,
  validateEvaluationState,
  type ValidationIssue,
} from "./validate.js";

export type { EvaluateInput, EvaluateOptions } from "./evaluate.js";
export { evaluate } from "./evaluate.js";
export {
  buildTemplateFeedback,
  FEEDBACK_TEMPLATE_M1_V1,
  FEEDBACK_TEMPLATE_M2_V1,
  FEEDBACK_TEMPLATE_M3_V1,
  FEEDBACK_TEMPLATE_M3_V2,
} from "./feedback-template.js";

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
  parseLevelProbabilities,
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
