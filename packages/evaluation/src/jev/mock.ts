import type { ScoreLevel } from "../types.js";
import type { JevClient, JevScoreRequest, JevScoreResult } from "./types.js";

const SIGNAL_GROUPS: Record<string, readonly (readonly string[])[]> = {
  verifiability: [
    ["select", "connect"],
    ["visible", "line"],
    ["web", "browser"],
    ["test", "verify", "check"],
  ],
  "actionable-acceptance": [
    ["expo", "react native", "screen"],
    ["station"],
    ["line"],
    ["keep", "do not", "without"],
  ],
  specificity: [
    ["station"],
    ["eight", "8"],
    ["mouse", "touch", "select"],
    ["line"],
  ],
  "scope-limits": [
    ["eight", "8"],
    ["passenger", "demand"],
    ["backend"],
    ["keep", "preserve", "do not"],
  ],
};

export function heuristicScoreLevel(questionId: string, prompt: string): ScoreLevel {
  const groups = SIGNAL_GROUPS[questionId];
  if (!groups) return 2;
  const text = prompt.toLowerCase();
  const hits = groups.filter((group) => group.some((signal) => text.includes(signal))).length;
  return Math.min(4, hits) as ScoreLevel;
}

export type MockJevClientOptions = {
  levels?: Partial<Record<string, number>>;
  confidence?: number | null;
};

export class MockJevClient implements JevClient {
  constructor(private readonly options: MockJevClientOptions = {}) {}

  async score(request: JevScoreRequest): Promise<JevScoreResult> {
    const prompt = request.state.participantPrompt;
    const confidence =
      this.options.confidence === undefined ? 0.9 : this.options.confidence;
    return {
      decisions: request.questions.map((question) => ({
        questionId: question.id,
        score: this.options.levels?.[question.id] ?? heuristicScoreLevel(question.id, prompt),
        confidence,
      })),
      evaluator: {
        provider: "mock",
        requestedModel: "mock-keyword-v1",
        model: "mock-keyword-v1",
      },
    };
  }
}
