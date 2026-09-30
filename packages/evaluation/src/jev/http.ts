import type { JevClient, JevEvaluationState, JevScoreDecision, JevScoreRequest } from "./types.js";

export type HttpJevConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type WireScoreAnswer = {
  type?: string;
  score?: unknown;
  confidence?: unknown;
};

type WireResponse = {
  answers?: Record<string, WireScoreAnswer>;
};

export function systemOneUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/v1/systemone`;
}

export function buildSystemOneBody(
  request: JevScoreRequest,
  model: string,
): {
  model: string;
  state: JevEvaluationState;
  questions: Record<
    string,
    { type: "score"; instructions: string; criteria: string[] }
  >;
} {
  const questions: Record<
    string,
    { type: "score"; instructions: string; criteria: string[] }
  > = {};
  for (const question of request.questions) {
    questions[question.id] = {
      type: "score",
      instructions: question.instructions,
      criteria: question.criteria,
    };
  }
  return { model, state: request.state, questions };
}

export class HttpJevClient implements JevClient {
  constructor(
    private readonly config: HttpJevConfig,
    private readonly fetchImpl: FetchLike = globalThis.fetch,
  ) {}

  async score(request: JevScoreRequest): Promise<JevScoreDecision[]> {
    if (request.questions.length === 0) {
      throw new Error("Jev request has no questions");
    }
    const url = systemOneUrl(this.config.baseUrl);
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildSystemOneBody(request, this.config.model)),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Jev HTTP ${response.status} from ${url}: ${text.slice(0, 500)}`);
    }
    let parsed: WireResponse;
    try {
      parsed = JSON.parse(text) as WireResponse;
    } catch {
      throw new Error("Jev HTTP response was not JSON");
    }
    const answers = parsed.answers ?? {};
    return request.questions.map((question) => {
      const raw = answers[question.id];
      if (!raw || raw.type !== "score" || typeof raw.score !== "number") {
        throw new Error(`Jev response missing score answer for ${question.id}`);
      }
      return {
        questionId: question.id,
        score: raw.score,
        confidence: typeof raw.confidence === "number" ? raw.confidence : null,
      };
    });
  }
}
