import type { CodeSubmission } from "@metro/evaluation";
import { parsePrBody } from "./body.js";
import type { PullRequestInfo } from "./github-pr.js";

export type PrSource = {
  get(number: number): Promise<PullRequestInfo>;
  diffFromBase(baseSha: string, headSha: string): Promise<{ diff: string; mergeBase: string }>;
};

export type PrepareInput = {
  prNumber: number;
  participantId: string;
  missionId: string;
  devSha: string;
  repoFullName: string;
  /** Optional p-XXX → GitHub login registry kept outside the repo. */
  logins?: Record<string, string>;
};

export type Prepared =
  | { ok: true; prompt: string; submission: CodeSubmission }
  | { ok: false; reasons: string[] };

/** Every refusal happens before an attempt is consumed. Messages are participant-facing Spanish. */
export async function preparePrSubmission(source: PrSource, input: PrepareInput): Promise<Prepared> {
  const pr = await source.get(input.prNumber);
  if (!pr.open) return { ok: false, reasons: ["El PR está cerrado."] };
  if (pr.baseRepo !== input.repoFullName || pr.baseRef !== "dev") {
    return { ok: false, reasons: [`El PR debe apuntar a la rama \`dev\` de ${input.repoFullName}.`] };
  }
  const expectedLogin = input.logins?.[input.participantId];
  if (input.logins && (!expectedLogin || expectedLogin.toLowerCase() !== pr.authorLogin.toLowerCase())) {
    return { ok: false, reasons: ["Este PR no está registrado a tu nombre de participante."] };
  }

  const body = parsePrBody(pr.body);
  if (!body.ok) return { ok: false, reasons: body.problems };
  const reasons: string[] = [];
  if (body.value.participantId !== input.participantId) {
    reasons.push("El identificador de participante del PR no coincide con el tuyo.");
  }
  if (body.value.missionId !== input.missionId) {
    reasons.push(`El PR debe indicar \`Misión: ${input.missionId}\`.`);
  }
  if (body.value.baseSha !== input.devSha) {
    reasons.push("El SHA base del PR no es el SHA de `dev` publicado para esta misión.");
  }
  if (reasons.length > 0) return { ok: false, reasons };

  const { diff, mergeBase } = await source.diffFromBase(input.devSha, pr.headSha);
  if (mergeBase !== input.devSha) {
    return { ok: false, reasons: ["Tu rama no parte del SHA publicado de `dev`. Actualiza tu fork desde ese SHA."] };
  }

  return {
    ok: true,
    prompt: body.value.prompt,
    submission: {
      prUrl: pr.url,
      headSha: pr.headSha,
      baseSha: input.devSha,
      diff,
      declaredTests: body.value.tests,
      changeOrigin: body.value.changeOrigin,
      changeDeclaration: body.value.changeDeclaration,
    },
  };
}
