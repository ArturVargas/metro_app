import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTemplateFeedback } from "@metro/evaluation";
import { buildLocalFeedbackUserMessage } from "./local.js";
import type {
  FeedbackGenerator,
  FeedbackInput,
  FeedbackResult,
} from "./types.js";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";
export const DEFAULT_MENTOR_PROMPT_VERSION = "feedback-mentor-m1-v1";

export type OpenRouterConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  /** Absolute path to mentor.md; defaults to apps/community/prompts/mentor.md */
  mentorPath?: string;
  /** Injected system prompt (tests); skips reading mentor.md when set */
  systemPrompt?: string;
  /** Injected prompt version (tests) */
  promptVersion?: string;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type ChatWire = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

function defaultMentorPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..", "prompts", "mentor.md");
}

export function parseMentorMarkdown(raw: string): {
  version: string;
  systemPrompt: string;
} {
  const trimmed = raw.replace(/^\uFEFF/, "");
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      version: DEFAULT_MENTOR_PROMPT_VERSION,
      systemPrompt: trimmed.trim(),
    };
  }
  const frontmatter = match[1] ?? "";
  const body = (match[2] ?? "").trim();
  const versionLine = frontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("version:"));
  const version = versionLine
    ? versionLine.slice("version:".length).trim()
    : DEFAULT_MENTOR_PROMPT_VERSION;
  return {
    version: version || DEFAULT_MENTOR_PROMPT_VERSION,
    systemPrompt: body,
  };
}

export function loadMentorPrompt(path: string = defaultMentorPath()): {
  version: string;
  systemPrompt: string;
} {
  const raw = readFileSync(path, "utf8");
  return parseMentorMarkdown(raw);
}

export function readOpenRouterConfig(
  env: NodeJS.ProcessEnv = process.env,
): Required<Pick<OpenRouterConfig, "baseUrl" | "model">> & OpenRouterConfig {
  const baseUrl =
    (env.OPENROUTER_BASE_URL ?? DEFAULT_OPENROUTER_BASE_URL).trim() ||
    DEFAULT_OPENROUTER_BASE_URL;
  const model =
    (env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL).trim() ||
    DEFAULT_OPENROUTER_MODEL;
  const apiKey = (env.OPENROUTER_API_KEY ?? "").trim() || undefined;
  return { baseUrl, model, apiKey };
}

export class OpenRouterFeedbackGenerator implements FeedbackGenerator {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly systemPrompt: string;
  private readonly promptVersion: string;

  constructor(
    config: OpenRouterConfig = {},
    private readonly fetchImpl: FetchLike = globalThis.fetch,
  ) {
    this.apiKey = config.apiKey?.trim() || undefined;
    this.baseUrl = (config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(
      /\/$/,
      "",
    );
    this.model = config.model ?? DEFAULT_OPENROUTER_MODEL;
    this.temperature = config.temperature ?? 0.2;

    if (config.systemPrompt !== undefined) {
      this.systemPrompt = config.systemPrompt;
      this.promptVersion =
        config.promptVersion ?? DEFAULT_MENTOR_PROMPT_VERSION;
    } else {
      const loaded = loadMentorPrompt(config.mentorPath ?? defaultMentorPath());
      this.systemPrompt = loaded.systemPrompt;
      this.promptVersion =
        config.promptVersion ?? loaded.version ?? DEFAULT_MENTOR_PROMPT_VERSION;
    }
  }

  async generate(input: FeedbackInput): Promise<FeedbackResult> {
    try {
      return await this.generateFromOpenRouter(input);
    } catch {
      return buildTemplateFeedback(input.scoreResult);
    }
  }

  private async generateFromOpenRouter(
    input: FeedbackInput,
  ): Promise<FeedbackResult> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }

    const url = `${this.baseUrl}/chat/completions`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: buildLocalFeedbackUserMessage(input) },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `OpenRouter HTTP ${response.status} from ${url}: ${text.slice(0, 500)}`,
      );
    }

    let parsed: ChatWire;
    try {
      parsed = JSON.parse(text) as ChatWire;
    } catch {
      throw new Error("OpenRouter response was not JSON");
    }

    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("OpenRouter response missing choices[0].message.content");
    }

    return {
      text: content.trim(),
      metadata: {
        kind: "llm",
        version: this.promptVersion,
        provider: "openrouter",
        model: this.model,
      },
    };
  }
}
