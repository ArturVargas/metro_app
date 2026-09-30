import type { ScoreResult } from "@metro/evaluation";

export type FeedbackInput = {
  participantPrompt: string;
  publicBrief: string;
  scoreResult: ScoreResult;
  missionId: string;
  attempt: number;
};

export interface FeedbackGenerator {
  generate(input: FeedbackInput): Promise<string>;
}
