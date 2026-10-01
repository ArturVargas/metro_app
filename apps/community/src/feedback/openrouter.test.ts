import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ScoreResult } from "@metro/evaluation";
import {
  DEFAULT_MENTOR_PROMPT_VERSION,
  DEFAULT_OPENROUTER_BASE_URL,
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterFeedbackGenerator,
  parseMentorMarkdown,
  readOpenRouterConfig,
  type FetchLike,
} from "./openrouter.js";
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

const sampleMentor = `---
version: feedback-mentor-m1-v1
---

Eres Picosito. Nunca inventes el puntaje.
`;

describe("parseMentorMarkdown", () => {
  it("reads version frontmatter and body", () => {
    const parsed = parseMentorMarkdown(sampleMentor);
    assert.equal(parsed.version, DEFAULT_MENTOR_PROMPT_VERSION);
    assert.match(parsed.systemPrompt, /Picosito/);
    assert.doesNotMatch(parsed.systemPrompt, /^---/);
  });
});

describe("readOpenRouterConfig", () => {
  it("defaults and allows env overrides", () => {
    assert.equal(readOpenRouterConfig({}).baseUrl, DEFAULT_OPENROUTER_BASE_URL);
    assert.equal(readOpenRouterConfig({}).model, DEFAULT_OPENROUTER_MODEL);
    assert.equal(readOpenRouterConfig({}).apiKey, undefined);
    assert.equal(
      readOpenRouterConfig({ OPENROUTER_BASE_URL: "https://example.test/v1/" })
        .baseUrl,
      "https://example.test/v1/",
    );
    assert.equal(
      readOpenRouterConfig({ OPENROUTER_MODEL: "other/model" }).model,
      "other/model",
    );
    assert.equal(
      readOpenRouterConfig({ OPENROUTER_API_KEY: "sk-test" }).apiKey,
      "sk-test",
    );
  });
});

describe("OpenRouterFeedbackGenerator", () => {
  it("POSTs chat/completions with mentor system prompt and returns provenance", async () => {
    let seenUrl = "";
    let seenHeaders: HeadersInit | undefined;
    let seenBody: Record<string, unknown> = {};
    const fetchMock: FetchLike = async (url, init) => {
      seenUrl = url;
      seenHeaders = init?.headers;
      seenBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          choices: [
            {
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
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const result = await new OpenRouterFeedbackGenerator(
      {
        apiKey: "sk-test",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "google/gemini-2.5-flash",
        systemPrompt: sampleMentor.split("---").pop()?.trim() ?? "mentor",
        promptVersion: DEFAULT_MENTOR_PROMPT_VERSION,
      },
      fetchMock,
    ).generate(input);

    assert.equal(seenUrl, "https://openrouter.ai/api/v1/chat/completions");
    const headers = new Headers(seenHeaders);
    assert.equal(headers.get("Authorization"), "Bearer sk-test");
    assert.equal(seenBody.model, "google/gemini-2.5-flash");
    assert.equal(seenBody.temperature, 0.2);
    const messages = seenBody.messages as Array<{ role: string; content: string }>;
    assert.equal(messages[0]?.role, "system");
    assert.match(messages[0]?.content ?? "", /Picosito/);
    assert.doesNotMatch(messages[0]?.content ?? "", /Hermes/);
    assert.equal(messages[1]?.role, "user");
    assert.match(messages[1]?.content ?? "", /72/);
    assert.match(result.text, /^Puntaje: 72\/100/);
    assert.deepEqual(result.metadata, {
      kind: "llm",
      version: DEFAULT_MENTOR_PROMPT_VERSION,
      provider: "openrouter",
      model: "google/gemini-2.5-flash",
    });
  });

  it("falls back to template when API key missing, HTTP fails, or content empty", async () => {
    const noKey = await new OpenRouterFeedbackGenerator(
      { systemPrompt: "x", promptVersion: "v" },
      async () => new Response("unused"),
    ).generate(input);
    assert.equal(noKey.metadata.kind, "template");
    assert.match(noKey.text, /Puntaje: 72\/100/);

    const badStatus: FetchLike = async () =>
      new Response("down", { status: 502 });
    const failed = await new OpenRouterFeedbackGenerator(
      { apiKey: "sk-test", systemPrompt: "x", promptVersion: "v" },
      badStatus,
    ).generate(input);
    assert.equal(failed.metadata.kind, "template");
    assert.match(failed.text, /Puntaje: 72\/100/);

    const empty: FetchLike = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "   " } }] }), {
        status: 200,
      });
    const emptyResult = await new OpenRouterFeedbackGenerator(
      { apiKey: "sk-test", systemPrompt: "x", promptVersion: "v" },
      empty,
    ).generate(input);
    assert.equal(emptyResult.metadata.kind, "template");
  });

  it("loads mentor.md from disk by default", async () => {
    const fetchMock: FetchLike = async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      assert.match(body.messages[0]?.content ?? "", /Picosito/);
      assert.match(body.messages[0]?.content ?? "", /Nunca inventes/);
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "Puntaje: 72/100\nElegibilidad: Elegible\nFortaleza: ok\nProblemas prioritarios:\n- a\nSugerencias:\n- b\nPregunta: c" } }],
        }),
        { status: 200 },
      );
    };
    const result = await new OpenRouterFeedbackGenerator(
      { apiKey: "sk-test" },
      fetchMock,
    ).generate(input);
    assert.equal(result.metadata.kind, "llm");
    if (result.metadata.kind === "llm") {
      assert.equal(result.metadata.provider, "openrouter");
    }
    assert.equal(result.metadata.version, DEFAULT_MENTOR_PROMPT_VERSION);
  });
});
