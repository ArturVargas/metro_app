/**
 * Mission 1 v2 eligibility hard-fail policy (ADR-0009).
 *
 * HARD fails force eligible=false and cap total below ELIGIBILITY_THRESHOLD.
 * SOFT fails are handled only by rubric Score weights (keep composite <70).
 */

import { ELIGIBILITY_THRESHOLD } from "./attempt.js";
import type { ScoreResult } from "./types.js";

/** Cap applied when any hard-fail fires (strictly below eligibility threshold). */
export const HARD_FAIL_SCORE_CAP = 69 as const;

export type HardFailId =
  | "missing-select-connect"
  | "missing-visible-line"
  | "missing-web-verify"
  | "alters-stations"
  | "requires-demand-or-backend";

export const M1_V2_HARD_FAIL_IDS: readonly HardFailId[] = [
  "missing-select-connect",
  "missing-visible-line",
  "missing-web-verify",
  "alters-stations",
  "requires-demand-or-backend",
] as const;

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Detect Mission 1 hard-fail conditions from the participant prompt.
 * Absence of required playable outcomes, or presence of out-of-scope demands.
 * Soft vagueness / ambiguous flow / incompatible tech are NOT hard fails.
 */
export function detectM1V2HardFails(participantPrompt: string): HardFailId[] {
  const text = participantPrompt.toLowerCase();
  const fails: HardFailId[] = [];

  const hasSelect = includesAny(text, [
    /\bselect(?:ing|ion)?\b/,
    /\bseleccion\w*/,
    /\belegir\b/,
    /\belige\b/,
    /\bpick\b/,
  ]);
  const hasConnect = includesAny(text, [
    /\bconnect(?:ing|ion)?\b/,
    /\bconect\w*/,
    /\bunir\w*/,
    /\bune\b/,
  ]);
  if (!(hasSelect && hasConnect)) {
    fails.push("missing-select-connect");
  }

  const hasLine = includesAny(text, [/\bline\b/, /\bl[ií]nea\b/]);
  const hasVisible = includesAny(text, [
    /\bvisible\b/,
    /\bclear(?:ly)?\b/,
    /\bclara\b/,
    /\bclaro\b/,
    /\bverse\b/,
    /\bvea\b/,
    /\baparezca\b/,
    /\baparece\b/,
    /\bshow(?:s|ing)?\b/,
    /\bmostr(?:ar|ando)?\b/,
  ]);
  if (!(hasLine && hasVisible)) {
    fails.push("missing-visible-line");
  }

  const hasWeb = includesAny(text, [
    /\bweb\b/,
    /\bbrowser\b/,
    /\bversi[oó]n web\b/,
    /\bexpo\/?web\b/,
  ]);
  const hasVerify = includesAny(text, [
    /\bverif(?:y|ication|icar|icaci[oó]n)\b/,
    /\bcheck(?:s|ing)?\b/,
    /\bcomprob(?:ar|arse|aci[oó]n)?\b/,
    /\bprobar\b/,
    /\bprueba\b/,
    /\btest(?:s|ing)?\b/,
    /\bconfirm(?:ar|s|ing)?\b/,
  ]);
  const hasOneMinute = includesAny(text, [
    /\bless than (a |one )?minute\b/,
    /\bunder (a |one )?minute\b/,
    /<\s*1\s*min/,
    /\ben menos de un minuto\b/,
    /\bmenos de un minuto\b/,
    /\b1\s*min(ute|uto)?\b/,
  ]);
  if (!(hasWeb && (hasVerify || hasOneMinute))) {
    fails.push("missing-web-verify");
  }

  const altersStations = includesAny(text, [
    /\b(move|relocate|reposition|redesign|replace|remove)\b.{0,40}\bstations?\b/,
    /\b(mover|reubicar|rediseñar|reemplazar|eliminar|quitar)\b.{0,40}\bestaciones\b/,
    /\bstations?\b.{0,40}\b(different|new) (positions?|identit)/,
    /\bcambia(r)? (las )?posiciones de las estaciones\b/,
    /\bcambia(r)? (el )?n[uú]mero de estaciones\b/,
    /\b(7|nueve|nine|diez|10|seis|6)\s+estaciones\b/,
    /\badd (more |new )?stations\b/,
    /\bagrega(r)? (más |nuevas )?estaciones\b/,
  ]);
  if (altersStations) {
    fails.push("alters-stations");
  }

  const excludesDemandOrBackend = includesAny(text, [
    /\bno (agregues |añadas |agregar |añadir )?(passengers?|pasajeros?|demand|demanda)\b/,
    /\bsin (mec[aá]nicas de )?(demanda|pasajeros?)\b/,
    /\bwithout (passengers?|demand)\b/,
    /\bdo not (add |include )?(passengers?|demand)\b/,
    /\bno (agregues |añadas )?pasajeros\b/,
    /\bno (agregues |añadas )?demanda\b/,
    /\bno (agregues |añadas |implementes )?backend\b/,
    /\bsin backend\b/,
    /\bwithout .{0,24}backend\b/,
    /\bno game backend\b/,
    /\bno passengers, no demand, no backend\b/,
    /\bno passengers, demand, or game backend\b/,
    /\bsin pasajeros, demanda ni backend\b/,
  ]);

  const requiresDemandOrBackend =
    !excludesDemandOrBackend &&
    includesAny(text, [
      /\b(add|implement|include|create|require|need)\b.{0,40}\b(passengers?|demand|backend)\b/,
      /\b(agrega|añade|implementa|incluye|crea|requiere|necesita)\b.{0,40}\b(pasajeros?|demanda|backend)\b/,
      /\bpassengers?\b.{0,30}\b(mechanics|system|feature)\b/,
      /\bpasajeros?\b.{0,30}\b(mec[aá]nica|sistema|feature)\b/,
      /\bgame backend\b/,
      /\bbackend del juego\b/,
      /\bdemanda de pasajeros\b/,
      /\bpassenger demand\b/,
    ]);
  if (requiresDemandOrBackend) {
    fails.push("requires-demand-or-backend");
  }

  return [...new Set(fails)];
}

export type HardFailApplication = {
  score: ScoreResult;
  hardFails: HardFailId[];
  capped: boolean;
};

/**
 * Force ineligible and cap total at HARD_FAIL_SCORE_CAP when any hard fail is present.
 * Soft failures must not call this with ids — they stay under 70 via Score weights only.
 */
export function applyHardFailPolicy(
  score: ScoreResult,
  hardFails: readonly HardFailId[],
): HardFailApplication {
  const unique = [...new Set(hardFails)];
  if (unique.length === 0) {
    return {
      score: {
        ...score,
        eligible: score.total >= ELIGIBILITY_THRESHOLD,
      },
      hardFails: [],
      capped: false,
    };
  }
  const cappedTotal = Math.min(score.total, HARD_FAIL_SCORE_CAP);
  const note =
    ` Hard-fail policy (${unique.join(", ")}): force ineligible, cap total at ${HARD_FAIL_SCORE_CAP}.`;
  return {
    score: {
      ...score,
      total: cappedTotal,
      eligible: false,
      notes: `${score.notes}${note}`,
    },
    hardFails: unique,
    capped: score.total > HARD_FAIL_SCORE_CAP,
  };
}
