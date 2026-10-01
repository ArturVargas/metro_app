import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MockJevClient,
  type AttemptResult,
  type JevClient,
} from "@metro/evaluation";
import { evaluate } from "./evaluate.js";

const input = {
  missionId: "mission-m1",
  participantId: "p-alpha",
  publicBrief: "brief",
  participantPrompt: "hello",
  attempt: 1,
};

const liveClient: JevClient = {
  async score(request) {
    return {
      decisions: request.questions.map((question) => ({
        questionId: question.id,
        score: 3,
        confidence: 0.9,
      })),
      evaluator: {
        provider: "typesafe",
        requestedModel: "jev-latest",
        model: "jev-1.13.0",
      },
    };
  },
};

const validLlmFeedback = {
  text: [
    "Puntaje: 75/100",
    "Elegibilidad: Elegible",
    "Fortaleza: El resultado puede comprobarse.",
    "Problemas prioritarios:",
    "- Falta precisar un estado visible.",
    "Sugerencias:",
    "- Describe ese estado.",
    "Pregunta: ¿Qué verá el jugador al terminar?",
  ].join("\n"),
  metadata: {
    kind: "llm" as const,
    version: "feedback-ollama-m1-v1",
    provider: "ollama",
    model: "gemma4-coding-agent",
  },
};

describe("community evaluate", () => {
  it("fills template feedback and does not touch the store unless record", async () => {
    let called = false;
    const result = await evaluate(input, {
      client: new MockJevClient({
        levels: {
          verifiability: 3,
          "actionable-acceptance": 3,
          specificity: 3,
          "scope-limits": 3,
        },
      }),
      record: false,
      store: {
        async recordAttempt() {
          called = true;
          return input as unknown as AttemptResult;
        },
      },
    });
    assert.equal(called, false);
    assert.match(result.feedback, /Puntaje: 75\/100/);
    assert.match(result.feedback, /Elegibilidad: Elegible/);
    assert.equal(result.feedbackMetadata.kind, "template");
  });

  it("reserves the attempt before scoring and persists LLM provenance", async () => {
    let admitted = false;
    let seen: AttemptResult | undefined;
    const client: JevClient = {
      async score(request) {
        assert.equal(admitted, true);
        return liveClient.score(request);
      },
    };
    const result = await evaluate(input, {
      client,
      record: true,
      feedbackGenerator: {
        async generate() {
          return validLlmFeedback;
        },
      },
      store: {
        async recordAttempt(_input, runEvaluation) {
          admitted = true;
          seen = await runEvaluation();
          return {
            ...seen,
            githubIssueUrl: "https://github.com/example/issues/7",
            githubCommentUrl: "https://github.com/example/issues/7#issuecomment-1",
          };
        },
      },
    });
    assert.equal(result.githubIssueUrl, "https://github.com/example/issues/7");
    assert.equal(result.feedback, validLlmFeedback.text);
    assert.deepEqual(result.feedbackMetadata, validLlmFeedback.metadata);
    assert.equal(seen?.feedbackMetadata.kind, "llm");
  });

  it("uses the template when generated feedback throws or is invalid", async () => {
    const failed = await evaluate(input, {
      client: liveClient,
      feedbackGenerator: {
        async generate() {
          throw new Error("ollama unavailable");
        },
      },
    });
    const invalid = await evaluate(input, {
      client: liveClient,
      feedbackGenerator: {
        async generate() {
          return {
            text: "Puntaje: 100/100. Elegible.",
            metadata: validLlmFeedback.metadata,
          };
        },
      },
    });
    assert.equal(failed.feedbackMetadata.kind, "template");
    assert.equal(invalid.feedbackMetadata.kind, "template");
    assert.match(failed.feedback, /Puntaje: 75\/100/);
    assert.match(invalid.feedback, /Puntaje: 75\/100/);
  });

  it("rejects more than two problems or unmatched suggestions", async () => {
    const result = await evaluate(input, {
      client: liveClient,
      feedbackGenerator: {
        async generate() {
          return {
            ...validLlmFeedback,
            text: validLlmFeedback.text.replace(
              "Sugerencias:",
              "- Segundo problema.\n- Tercer problema.\nSugerencias:",
            ),
          };
        },
      },
    });
    assert.equal(result.feedbackMetadata.kind, "template");
  });

  it("rejects feedback with extra text or a conflicting score", async () => {
    const result = await evaluate(input, {
      client: liveClient,
      feedbackGenerator: {
        async generate() {
          return {
            ...validLlmFeedback,
            text: `${validLlmFeedback.text}\nPuntaje alternativo: 100/100`,
          };
        },
      },
    });

    assert.equal(result.feedbackMetadata.kind, "template");
    assert.doesNotMatch(result.feedback, /Puntaje alternativo/);
  });

  it("checks the persisted attempt sequence before evaluating", async () => {
    let evaluated = false;
    const client: JevClient = {
      async score() {
        evaluated = true;
        throw new Error("must not evaluate");
      },
    };
    await assert.rejects(
      () =>
        evaluate(input, {
          client,
          record: true,
          store: {
            async recordAttempt() {
              throw new Error("maximum of 5 evaluations reached");
            },
          },
        }),
      /maximum of 5 evaluations/,
    );
    assert.equal(evaluated, false);
  });

  it("never persists a mock evaluation", async () => {
    let persisted = false;
    await assert.rejects(
      () =>
        evaluate(input, {
          client: new MockJevClient(),
          record: true,
          store: {
            async recordAttempt(_input, runEvaluation) {
              const attempt = await runEvaluation();
              persisted = true;
              return attempt;
            },
          },
        }),
      /mock evaluation cannot be recorded/,
    );
    assert.equal(persisted, false);
  });

  it("requires a token when recording without an injected store", async () => {
    await assert.rejects(
      () => evaluate(input, { client: liveClient, record: true, env: {} }),
      /GITHUB_TOKEN/,
    );
  });
});
