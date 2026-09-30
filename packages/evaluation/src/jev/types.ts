export type JevEvaluationState = {
  missionId: string;
  rubricVersion: string;
  publicBrief: string;
  participantPrompt: string;
};

export type JevScoreQuestionPayload = {
  id: string;
  instructions: string;
  criteria: string[];
};

export type JevScoreRequest = {
  state: JevEvaluationState;
  questions: JevScoreQuestionPayload[];
};

export type JevScoreDecision = {
  questionId: string;
  score: number | null;
  confidence: number | null;
  escapeOptionId?: string;
};

export type EvaluatorMetadata = {
  provider: "typesafe" | "mock";
  requestedModel: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
};

export type JevScoreResult = {
  decisions: JevScoreDecision[];
  evaluator: EvaluatorMetadata;
};

export interface JevClient {
  score(request: JevScoreRequest): Promise<JevScoreResult>;
}
