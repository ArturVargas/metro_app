import { HttpJevClient, type HttpJevConfig } from "./http.js";
import { MockJevClient } from "./mock.js";
import type { JevClient } from "./types.js";

export const DEFAULT_JEV_BASE_URL = "https://api.typesafe.ai";
export const DEFAULT_JEV_MODEL = "jev-latest";

export type JevMode = "mock" | "http";

export function readJevApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const raw = env.TYPESAFE_API_KEY ?? env.JEV_API_KEY;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readJevMode(env: NodeJS.ProcessEnv = process.env): JevMode {
  const raw = (env.JEV_MODE ?? "mock").trim().toLowerCase();
  if (raw === "" || raw === "mock") return "mock";
  if (raw === "http") return "http";
  throw new Error(`Unknown JEV_MODE "${env.JEV_MODE ?? ""}". Use mock or http.`);
}

export function readHttpJevConfig(
  env: NodeJS.ProcessEnv = process.env,
): HttpJevConfig {
  const apiKey = readJevApiKey(env);
  if (!apiKey) {
    throw new Error(
      "JEV_MODE=http requires TYPESAFE_API_KEY (or JEV_API_KEY). Do not commit secrets.",
    );
  }
  const baseUrl =
    (env.TYPESAFE_BASE_URL ?? DEFAULT_JEV_BASE_URL).trim() || DEFAULT_JEV_BASE_URL;
  const model =
    (env.TYPESAFE_DEFAULT_MODEL ?? env.JEV_MODEL ?? DEFAULT_JEV_MODEL).trim() ||
    DEFAULT_JEV_MODEL;
  return { apiKey, baseUrl, model };
}

export function createJevClient(env: NodeJS.ProcessEnv = process.env): JevClient {
  if (readJevMode(env) === "mock") return new MockJevClient();
  return new HttpJevClient(readHttpJevConfig(env));
}
