import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ScoreResult } from "@metro/evaluation";
import {
  LOCAL_FEEDBACK_PROMPT_VERSION,
  LocalLlmFeedbackGenerator,
  buildLocalFeedbackUserMessage,
  readLocalLlmConfig,
  type FetchLike,
} from "./local.js";
import type { FeedbackInput } from "./types.js";

function score(
  partial: Partial<ScoreResult> & Pick<ScoreResult, "total" | "dimensions">,
): ScoreResult {
  return {
    eligible: null,
    rubricVersion: "rubric-m1-v1",
    notes: "",
    routing: { action: "auto", confidenceSummary: null, probabilitySummary: null },
    ...partial,
  };
}

const input: FeedbackInput = {
  participantPrompt: "Conecta estaciones con línea visible. Verifica en web.",
  publicBrief:
    "Change the station board so a player can select and connect stations with a visible line. No passengers, demand, or game backend.",
  missionId: "mission-m1",
  attempt: 1,
  scoreResult: score({
    total: 72,
    eligible: true,
    dimensions: [
      { questionId: "specificity", level: 3, normalized: 0.75, weight: 0.25 },
      { questionId: "verifiability", level: 2, normalized: 0.5, weight: 0.3 },
      { questionId: "actionable-acceptance", level: 3, normalized: 0.75, weight: 0.3 },
      { questionId: "scope-limits", level: 3, normalized: 0.75, weight: 0.15 },
    ],
  }),
};

describe("buildLocalFeedbackUserMessage", () => {
  it("includes brief, prompt, score, and weak dims without inventing extras", () => {
    const text = buildLocalFeedbackUserMessage(input);
    assert.match(text, /Brief:/);
    assert.match(text, /72/);
    assert.match(text, /elegible/);
    assert.match(text, /verifiability 2\/4 \(débil\)/);
    assert.doesNotMatch(text, /pasajeros.*demanda.*IA/i);
  });
});

describe("readLocalLlmConfig", () => {
  it("defaults and allows env overrides", () => {
    assert.equal(readLocalLlmConfig({}).baseUrl, "http://127.0.0.1:11434");
    assert.equal(readLocalLlmConfig({}).model, "gemma4-coding-agent");
    assert.equal(
      readLocalLlmConfig({ OLLAMA_BASE_URL: "http://ollama:11434/" }).baseUrl,
      "http://ollama:11434/",
    );
    assert.equal(readLocalLlmConfig({ OLLAMA_MODEL: "other" }).model, "other");
  });
});

describe("LocalLlmFeedbackGenerator", () => {
  it("POSTs /api/chat with think:false and returns text plus provenance", async () => {
    let seenUrl = "";
    let seenBody: Record<string, unknown> = {};
    const fetchMock: FetchLike = async (url, init) => {
      seenUrl = url;
      seenBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          message: {
            content: [
              "Puntaje: 72/100",
              "Elegibilidad: Elegible",
              "Fortaleza: La interacción es observable.",
              "Problemas prioritarios:",
              "- Falta precisar el resultado final.",
              "Sugerencias:",
              "- Describe el estado visible.",
              "Pregunta: ¿Qué debe ver el jugador?",
            ].join("\n"),
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };
    const result = await new LocalLlmFeedbackGenerator(
      { baseUrl: "http://127.0.0.1:11434", model: "gemma4-coding-agent" },
      fetchMock,
    ).generate(input);
    assert.equal(seenUrl, "http://127.0.0.1:11434/api/chat");
    assert.equal(seenBody.model, "gemma4-coding-agent");
    assert.equal(seenBody.stream, false);
    assert.equal(seenBody.think, false);
    const options = seenBody.options as { temperature: number; num_predict: number };
    assert.equal(options.temperature, 0.2);
    assert.equal(options.num_predict, 512);
    const messages = seenBody.messages as Array<{ role: string; content: string }>;
    assert.equal(messages[0]?.role, "system");
    assert.match(messages[0]?.content ?? "", /Problemas prioritarios/);
    assert.doesNotMatch(messages[0]?.content ?? "", /Hermes/);
    assert.equal(messages[1]?.role, "user");
    assert.match(messages[1]?.content ?? "", /72/);
    assert.match(result.text, /^Puntaje: 72\/100/);
    assert.deepEqual(result.metadata, {
      kind: "llm",
      version: LOCAL_FEEDBACK_PROMPT_VERSION,
      provider: "ollama",
      model: "gemma4-coding-agent",
    });
  });

  it("throws on non-OK or empty content", async () => {
    const badStatus: FetchLike = async () =>
      new Response("down", { status: 502 });
    await assert.rejects(
      () => new LocalLlmFeedbackGenerator({}, badStatus).generate(input),
      /Ollama HTTP 502/,
    );
    const empty: FetchLike = async () =>
      new Response(JSON.stringify({ message: { content: "   " } }), { status: 200 });
    await assert.rejects(
      () => new LocalLlmFeedbackGenerator({}, empty).generate(input),
      /missing message\.content/,
    );
  });
});
