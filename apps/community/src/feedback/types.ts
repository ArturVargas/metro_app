import type { FeedbackMetadata, ScoreResult } from "@metro/evaluation";

export type FeedbackInput = {
  participantPrompt: string;
  publicBrief: string;
  scoreResult: ScoreResult;
  missionId: string;
  attempt: number;
};

export type FeedbackResult = {
  text: string;
  metadata: FeedbackMetadata;
};

export interface FeedbackGenerator {
  generate(input: FeedbackInput): Promise<FeedbackResult>;
}
