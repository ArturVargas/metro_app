import { resolveEligible, type DimensionScore } from "@metro/evaluation";
import type { FeedbackGenerator, FeedbackInput } from "./types.js";

export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_MODEL = "gemma4-coding-agent";

const SYSTEM_PROMPT = `Eres el feedback del experimento Metro App. Responde SOLO en español, 3–5 frases cortas, tono WhatsApp amable.
Nunca menciones Jev, TypeSafe, rúbricas internas ni nombres de dimensiones en inglés.
Debes incluir el puntaje total X/100 y si es elegible (≥70) o no.
Prioriza consejos ACCIONABLES sobre verificación observable: qué debe verse en la web, gestos (tap/drag), resultado visible, cómo comprobar éxito. Si verifiability/scope fallan, di eso en lenguaje simple.
No inventes requisitos fuera del brief. No pidas pasajeros/demanda/backend si el brief los excluye.
No uses markdown largo ni listas de 10 bullets; máx 2 tips concretos.`;

export type LocalLlmConfig = {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  numPredict?: number;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type ChatWire = {
  message?: { content?: unknown; thinking?: unknown };
};

function formatScore(total: number): string {
  const rounded = Math.round(total * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function isWeak(dimension: DimensionScore): boolean {
  return dimension.level === null || dimension.level <= 2;
}

function dimLabel(questionId: string): string {
  if (questionId === "actionable-acceptance") return "actionable";
  if (questionId === "scope-limits") return "scope";
  return questionId;
}

export function buildLocalFeedbackUserMessage(input: FeedbackInput): string {
  const eligible = resolveEligible(input.scoreResult);
  const dims = input.scoreResult.dimensions
    .map((d) => {
      const level = d.level === null ? "?" : `${d.level}/4`;
      const weak = isWeak(d) ? " (débil)" : "";
      return `${dimLabel(d.questionId)} ${level}${weak}`;
    })
    .join(", ");
  const weakNotes = input.scoreResult.dimensions
    .filter(isWeak)
    .map((d) => dimLabel(d.questionId))
    .join(", ");
  const note = weakNotes
    ? `Nota débil: ${weakNotes}.`
    : "Sin dimensiones débiles.";
  return [
    `Brief: ${input.publicBrief}`,
    `Prompt participante: ${JSON.stringify(input.participantPrompt)}`,
    `Scores: total ${formatScore(input.scoreResult.total)} ${eligible ? "elegible" : "no elegible"}; ${dims || "sin dimensiones"}. ${note}`,
  ].join("\n");
}

export function readLocalLlmConfig(
  env: NodeJS.ProcessEnv = process.env,
): Required<Pick<LocalLlmConfig, "baseUrl" | "model">> & LocalLlmConfig {
  const baseUrl = (env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).trim() || DEFAULT_OLLAMA_BASE_URL;
  const model = (env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;
  return { baseUrl, model };
}

export class LocalLlmFeedbackGenerator implements FeedbackGenerator {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly numPredict: number;

  constructor(
    config: LocalLlmConfig = {},
    private readonly fetchImpl: FetchLike = globalThis.fetch,
  ) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
    this.model = config.model ?? DEFAULT_OLLAMA_MODEL;
    this.temperature = config.temperature ?? 0.2;
    this.numPredict = config.numPredict ?? 512;
  }

  async generate(input: FeedbackInput): Promise<string> {
    const url = `${this.baseUrl}/api/chat`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        think: false,
        options: { temperature: this.temperature, num_predict: this.numPredict },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildLocalFeedbackUserMessage(input) },
        ],
      }),
      signal: AbortSignal.timeout(300_000),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status} from ${url}: ${text.slice(0, 500)}`);
    }
    let parsed: ChatWire;
    try {
      parsed = JSON.parse(text) as ChatWire;
    } catch {
      throw new Error("Ollama response was not JSON");
    }
    const content = parsed.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("Ollama response missing message.content");
    }
    return content.trim();
  }
}
