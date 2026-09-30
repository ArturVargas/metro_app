import { resolveEligible, type DimensionScore } from "@metro/evaluation";
import type { FeedbackGenerator, FeedbackInput } from "./types.js";

const LABELS: Record<string, string> = {
  verifiability: "verificabilidad",
  "actionable-acceptance": "instrucciones accionables",
  specificity: "especificidad",
  "scope-limits": "límites de alcance",
};

function label(questionId: string): string {
  return LABELS[questionId] ?? questionId;
}

function isWeak(dimension: DimensionScore): boolean {
  return dimension.level === null || dimension.level <= 2;
}

function formatScore(total: number): string {
  const rounded = Math.round(total * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export class StubFeedbackGenerator implements FeedbackGenerator {
  async generate(input: FeedbackInput): Promise<string> {
    const eligible = resolveEligible(input.scoreResult);
    const weak = input.scoreResult.dimensions.filter(isWeak);
    const head = `Puntaje: ${formatScore(input.scoreResult.total)}/100. ${eligible ? "Elegible" : "No elegible"}.`;
    const body = weak.length
      ? `Por mejorar: ${weak
          .map((d) =>
            d.level === null ? label(d.questionId) : `${label(d.questionId)} (${d.level}/4)`,
          )
          .join(", ")}.`
      : "Sin puntos débiles.";
    return `${head}\n${body}`;
  }
}
