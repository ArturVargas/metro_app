import type { FeedbackMetadata } from "./attempt.js";
import type { ScoreResult } from "./types.js";

export const FEEDBACK_TEMPLATE_M1_V1 = "feedback-template-m1-v1" as const;

const COPY: Record<string, { name: string; strength: string; problem: string; suggestion: string }> = {
  verifiability: {
    name: "Verificabilidad",
    strength: "El prompt propone resultados que pueden comprobarse.",
    problem: "Faltan pruebas observables para decidir si el cambio funciona.",
    suggestion: "Agrega pasos concretos para verificar selección, conexión, línea visible y build web.",
  },
  "actionable-acceptance": {
    name: "Instrucciones accionables",
    strength: "El agente recibe suficiente contexto para ejecutar el cambio.",
    problem: "El agente todavía tendría que inventar parte del resultado esperado.",
    suggestion: "Describe la interacción y las condiciones exactas que indican que el trabajo terminó.",
  },
  specificity: {
    name: "Especificidad",
    strength: "El resultado y sus elementos principales están descritos con precisión.",
    problem: "El resultado solicitado todavía admite interpretaciones contradictorias.",
    suggestion: "Nombra los elementos, acciones y estados visibles que debe producir el cambio.",
  },
  "scope-limits": {
    name: "Límites de alcance",
    strength: "El prompt protege claramente lo que debe permanecer igual.",
    problem: "Los límites de la misión no están suficientemente protegidos.",
    suggestion: "Indica que deben conservarse ocho estaciones y que no se agregan pasajeros, demanda ni backend del juego.",
  },
};

export function buildTemplateFeedback(score: ScoreResult): {
  text: string;
  metadata: FeedbackMetadata;
} {
  const ranked = [...score.dimensions]
    .filter((dimension) => dimension.normalized !== null && COPY[dimension.questionId])
    .sort((a, b) => (b.normalized ?? 0) - (a.normalized ?? 0));
  const strongest = ranked[0];
  const weakest = [...ranked]
    .filter((dimension) => dimension.level !== 4)
    .sort((a, b) => (a.normalized ?? 0) - (b.normalized ?? 0))
    .slice(0, 2);
  const strength =
    strongest?.level !== null && strongest?.level !== undefined && strongest.level >= 2
      ? COPY[strongest.questionId]?.strength
      : "No se identificó una fortaleza concreta; la siguiente versión debe desarrollar al menos un criterio de la misión.";
  const problems = weakest.length
    ? weakest.map((dimension) => `- ${COPY[dimension.questionId]?.name}: ${COPY[dimension.questionId]?.problem}`)
    : ["- No hay problemas prioritarios en esta evaluación."];
  const suggestions = weakest.length
    ? weakest.map((dimension) => `- ${COPY[dimension.questionId]?.suggestion}`)
    : ["- Conserva la precisión actual y elimina cualquier frase que no ayude a construir o comprobar el cambio."];
  const question = weakest[0]
    ? `¿Cómo puedes hacer más comprobable el criterio de ${COPY[weakest[0].questionId]?.name.toLowerCase()} en tu siguiente versión?`
    : "¿Puedes mantener estos criterios usando menos texto y sin perder información comprobable?";

  return {
    text: [
      `Puntaje: ${Math.round(score.total)}/100`,
      `Fortaleza: ${strength}`,
      "Problemas prioritarios:",
      ...problems,
      "Sugerencias:",
      ...suggestions,
      `Pregunta: ${question}`,
    ].join("\n"),
    metadata: { kind: "template", version: FEEDBACK_TEMPLATE_M1_V1 },
  };
}
