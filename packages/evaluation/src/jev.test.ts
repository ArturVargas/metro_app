import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readHttpJevConfig, readJevMode } from "./jev/env.js";
import {
  buildSystemOneBody,
  HttpJevClient,
  parseLevelProbabilities,
  systemOneUrl,
} from "./jev/http.js";
import {
  confidenceBand,
  decisionsToScoreAnswers,
  rubricToJevQuestions,
  toScoreLevel,
} from "./jev/map.js";
import { heuristicScoreLevel, MockJevClient } from "./jev/mock.js";
import { rubricM1V1Questions } from "./rubrics/m1-v1.js";
import type { ScoreQuestion } from "./types.js";

const state = {
  missionId: "mission-m1",
  rubricVersion: "rubric-m1-v1",
  publicBrief: "brief",
  participantPrompt: "select stations",
};

describe("rubricToJevQuestions / score mapping", () => {
  it("sends m1 criteria low to high", () => {
    const payloads = rubricToJevQuestions(rubricM1V1Questions);
    assert.equal(payloads.length, 4);
    assert.deepEqual(
      payloads.map((q) => q.id),
      ["verifiability", "actionable-acceptance", "specificity", "scope-limits"],
    );
    for (const payload of payloads) {
      assert.equal(payload.criteria.length, 5);
    }
  });

  it("sorts criteria by level", () => {
    const shuffled: ScoreQuestion = {
      id: "specificity",
      kind: "score",
      prompt: "How specific?",
      weight: 1,
      criteria: [
        { level: 2, description: "mid" },
        { level: 0, description: "low" },
        { level: 4, description: "top" },
        { level: 1, description: "one" },
        { level: 3, description: "three" },
      ],
    };
    assert.deepEqual(rubricToJevQuestions([shuffled])[0]?.criteria, [
      "low",
      "one",
      "mid",
      "three",
      "top",
    ]);
  });

  it("rounds fractional scores and clamps to 0–4", () => {
    assert.equal(toScoreLevel(2.4), 2);
    assert.equal(toScoreLevel(2.5), 3);
    assert.equal(toScoreLevel(4.8), 4);
    assert.equal(toScoreLevel(-1), 0);
    assert.equal(confidenceBand(0.8), "high");
    assert.equal(confidenceBand(0.5), "medium");
    assert.equal(confidenceBand(0.49), "low");
  });

  it("maps escape and missing score to null value", () => {
    const [question] = rubricM1V1Questions;
    assert.ok(question);
    const answers = decisionsToScoreAnswers(
      [question],
      [{ questionId: question.id, score: 3.2, confidence: 0.2, escapeOptionId: "not-applicable" }],
    );
    assert.equal(answers[0]?.value, null);
    assert.equal(answers[0]?.escapeOptionId, "not-applicable");
    assert.equal(answers[0]?.confidence, "low");
  });
});

describe("MockJevClient", () => {
  it("uses explicit levels", async () => {
    const client = new MockJevClient({
      levels: { verifiability: 1 },
      confidence: 0.1,
    });
    const result = await client.score({
      state,
      questions: [{ id: "verifiability", instructions: "q", criteria: ["a", "b"] }],
    });
    const [decision] = result.decisions;
    assert.equal(decision?.score, 1);
    assert.equal(decision?.confidence, 0.1);
    assert.deepEqual(result.evaluator, {
      provider: "mock",
      requestedModel: "mock-keyword-v1",
      model: "mock-keyword-v1",
    });
  });

  it("heuristic is stable for a rich prompt", () => {
    const prompt =
      "Build an Expo screen: select and connect eight stations with a visible line. Verify in the web build. Keep the eight stations. No passengers, no demand, no backend.";
    assert.equal(heuristicScoreLevel("verifiability", prompt), 4);
    assert.equal(heuristicScoreLevel("actionable-acceptance", prompt), 4);
    assert.equal(heuristicScoreLevel("specificity", prompt), 4);
    assert.equal(heuristicScoreLevel("scope-limits", prompt), 4);
    assert.equal(heuristicScoreLevel("verifiability", "hi"), 0);
  });
});

describe("HttpJevClient", () => {
  it("posts systemone score questions and reads fractional answers", async () => {
    let seenUrl = "";
    let seenAuth = "";
    let seenBody = "";
    const client = new HttpJevClient(
      { apiKey: "secret-key", baseUrl: "https://api.typesafe.ai/", model: "jev-latest" },
      async (url, init) => {
        seenUrl = url;
        seenAuth = String(init?.headers && (init.headers as Record<string, string>).Authorization);
        seenBody = String(init?.body);
        return new Response(
          JSON.stringify({
            model: "jev-1.13.0",
            answers: {
              verifiability: {
                type: "score",
                score: 2.6,
                confidence: 0.91,
                probabilities: { "3": 1 },
              },
            },
            usage: { input_tokens: 10, output_tokens: 2 },
          }),
          { status: 200 },
        );
      },
    );
    const request = {
      state,
      questions: rubricToJevQuestions(rubricM1V1Questions).slice(0, 1),
    };
    const result = await client.score(request);
    assert.equal(seenUrl, "https://api.typesafe.ai/v1/systemone");
    assert.equal(seenAuth, "Bearer secret-key");
    assert.deepEqual(JSON.parse(seenBody), buildSystemOneBody(request, "jev-latest"));
    assert.equal(result.decisions[0]?.score, 2.6);
    assert.equal(result.decisions[0]?.confidence, 0.91);
    assert.deepEqual(result.evaluator, {
      provider: "typesafe",
      requestedModel: "jev-latest",
      model: "jev-1.13.0",
      usage: { inputTokens: 10, outputTokens: 2 },
    });
    assert.equal(systemOneUrl("https://api.typesafe.ai"), seenUrl);
  });

  it("errors without echoing the key", async () => {
    const client = new HttpJevClient(
      { apiKey: "super-secret", baseUrl: "https://api.typesafe.ai", model: "jev-latest" },
      async () => new Response("nope", { status: 401 }),
    );
    await assert.rejects(
      () =>
        client.score({
          state,
          questions: [{ id: "verifiability", instructions: "q", criteria: ["a", "b"] }],
        }),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /Jev HTTP 401/);
        assert.equal(err.message.includes("super-secret"), false);
        return true;
      },
    );
  });
});

describe("Jev env", () => {
  it("defaults to mock and reads http config", () => {
    assert.equal(readJevMode({}), "mock");
    assert.throws(() => readJevMode({ JEV_MODE: "live" }), /JEV_MODE/);
    assert.throws(() => readHttpJevConfig({ JEV_MODE: "http" }), /TYPESAFE_API_KEY/);
    const config = readHttpJevConfig({
      JEV_MODE: "http",
      JEV_API_KEY: " jv ",
      JEV_MODEL: "jev-1.13.0",
    });
    assert.equal(config.apiKey, "jv");
    assert.equal(config.baseUrl, "https://api.typesafe.ai");
    assert.equal(config.model, "jev-1.13.0");
  });
});

describe("Jev level probabilities", () => {
  it("reads levels 0..4 in order and normalizes them", () => {
    assert.deepEqual(parseLevelProbabilities({ "0": 0, "1": 0.1, "2": 0.1, "3": 0.3, "4": 0.5 }), [0, 0.1, 0.1, 0.3, 0.5]);
    const scaled = parseLevelProbabilities({ "0": 0, "1": 0, "2": 1, "3": 1, "4": 2 });
    assert.deepEqual(scaled, [0, 0, 0.25, 0.25, 0.5]);
  });

  it("ignores incomplete or malformed distributions", () => {
    assert.equal(parseLevelProbabilities({ "3": 1 }), undefined);
    assert.equal(parseLevelProbabilities({ "0": 0, "1": 0, "2": -1, "3": 1, "4": 1 }), undefined);
    assert.equal(parseLevelProbabilities([0.2, 0.2, 0.2, 0.2, 0.2]), undefined);
    assert.equal(parseLevelProbabilities(null), undefined);
  });

  it("passes probabilities and the unrounded score through the HTTP client", async () => {
    const probabilities = { "0": 0.01, "1": 0.17, "2": 0.23, "3": 0.27, "4": 0.32 };
    const client = new HttpJevClient(
      { apiKey: "k", baseUrl: "https://api.typesafe.ai", model: "jev-latest" },
      async () =>
        new Response(
          JSON.stringify({
            model: "jev-1.14.0",
            answers: { verifiability: { type: "score", score: 2.7, confidence: 0, probabilities } },
          }),
          { status: 200 },
        ),
    );
    const result = await client.score({ state, questions: rubricToJevQuestions(rubricM1V1Questions).slice(0, 1) });
    assert.deepEqual(result.decisions[0]?.probabilities, [0.01, 0.17, 0.23, 0.27, 0.32]);
    const [answer] = decisionsToScoreAnswers(rubricM1V1Questions.slice(0, 1), result.decisions);
    assert.equal(answer?.kind === "score" ? answer.value : undefined, 3);
    assert.equal(answer?.kind === "score" ? answer.expected : undefined, 2.7);
  });
});
