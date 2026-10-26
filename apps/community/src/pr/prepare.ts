import type { CodeSubmission } from "@metro/evaluation";
import { parsePrBody } from "./body.js";
import type { DiffContextReport } from "./diff-context.js";
import type { PrDiff, PullRequestInfo } from "./github-pr.js";

export type PrSource = {
  get(number: number): Promise<PullRequestInfo>;
  diffFromBase(baseSha: string, headSha: string): Promise<PrDiff>;
};

export type PrepareInput = {
  prNumber: number;
  participantId: string;
  missionId: string;
  devSha: string;
  repoFullName: string;
};

export type Prepared =
  | { ok: true; prompt: string; submission: CodeSubmission; diffContext: DiffContextReport }
  | { ok: false; retryable: boolean; reasons: string[] };

/** Participant-facing text for an evaluation refused because GitHub did not return the full context. */
export const INCOMPLETE_CONTEXT_MESSAGE =
  "No pudimos obtener de GitHub el contexto completo de tu PR (contexto incompleto). " +
  "No se usó ningún intento; vuelve a enviar el enlace en unos minutos.";

const refuse = (...reasons: string[]): Prepared => ({ ok: false, retryable: false, reasons });

/** Every refusal happens before an attempt is consumed. Messages are participant-facing Spanish. */
export async function preparePrSubmission(source: PrSource, input: PrepareInput): Promise<Prepared> {
  const pr = await source.get(input.prNumber);
  if (!pr.open) return refuse("El PR está cerrado.");
  if (pr.baseRepo !== input.repoFullName || pr.baseRef !== "dev") {
    return refuse(`El PR debe apuntar a la rama \`dev\` de ${input.repoFullName}.`);
  }

  const body = parsePrBody(pr.body);
  if (!body.ok) return refuse(...body.problems);
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
  if (reasons.length > 0) return refuse(...reasons);

  const { diff, mergeBase, context } = await source.diffFromBase(input.devSha, pr.headSha);
  if (mergeBase !== input.devSha) {
    return refuse("Tu rama no parte del SHA publicado de `dev`. Actualiza tu fork desde ese SHA.");
  }
  // A different context than calibration could change the score; refuse and let the caller retry.
  if (context.status === "incomplete") {
    return { ok: false, retryable: true, reasons: [INCOMPLETE_CONTEXT_MESSAGE] };
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
    diffContext: context,
  };
}
