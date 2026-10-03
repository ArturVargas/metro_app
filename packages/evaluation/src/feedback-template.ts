import { resolveEligible, type FeedbackMetadata } from "./attempt.js";
import type { ScoreResult } from "./types.js";

export const FEEDBACK_TEMPLATE_M1_V1 = "feedback-template-m1-v1" as const;
export const FEEDBACK_TEMPLATE_M2_V1 = "feedback-template-m2-v1" as const;

type FeedbackCopy = Record<
  string,
  { name: string; strength: string; problem: string; suggestion: string }
>;

const M1_COPY: FeedbackCopy = {
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

const M2_COPY: FeedbackCopy = {
  verifiability: {
    name: "Verificabilidad",
    strength: "El prompt propone resultados que pueden comprobarse.",
    problem: "Faltan pruebas observables para decidir si los trenes funcionan.",
    suggestion: "Agrega comprobaciones concretas para asignar, mover, retirar y reasignar un tren.",
  },
  "actionable-acceptance": {
    name: "Instrucciones accionables",
    strength: "El agente recibe suficiente contexto para ejecutar el cambio.",
    problem: "El agente todavía tendría que inventar parte de la interacción o del movimiento.",
    suggestion: "Describe las acciones del jugador y qué debe ocurrir con el tren en cada estado.",
  },
  specificity: {
    name: "Especificidad",
    strength: "La interacción y el movimiento esperado están descritos con precisión.",
    problem: "La interacción o el resultado visible admite interpretaciones contradictorias.",
    suggestion: "Define cómo se asigna, se muestra y se retira el tren sin prescribir la tecnología.",
  },
  "scope-limits": {
    name: "Límites de alcance",
    strength: "El prompt protege claramente lo que debe permanecer igual.",
    problem: "Los límites de la misión no están suficientemente protegidos.",
    suggestion: "Limita los trenes a esta misión, conserva las líneas y estaciones actuales y excluye pasajeros, puntaje, controles de velocidad y backend del juego.",
  },
};

export function buildTemplateFeedback(score: ScoreResult): {
  text: string;
  metadata: FeedbackMetadata;
} {
  const isMission2 = score.rubricVersion === "rubric-m2-v1";
  const copy = isMission2 ? M2_COPY : M1_COPY;
  const ranked = [...score.dimensions]
    .filter((dimension) => dimension.normalized !== null && copy[dimension.questionId])
    .sort((a, b) => (b.normalized ?? 0) - (a.normalized ?? 0));
  const strongest = ranked[0];
  const weakest = [...ranked]
    .filter((dimension) => dimension.level !== 4)
    .sort((a, b) => (a.normalized ?? 0) - (b.normalized ?? 0))
    .slice(0, 2);
  const strength =
    strongest?.level !== null && strongest?.level !== undefined && strongest.level >= 2
      ? copy[strongest.questionId]?.strength
      : "No se identificó una fortaleza concreta; la siguiente versión debe desarrollar al menos un criterio de la misión.";
  const problems = weakest.length
    ? weakest.map((dimension) => `- ${copy[dimension.questionId]?.name}: ${copy[dimension.questionId]?.problem}`)
    : ["- No hay problemas prioritarios en esta evaluación."];
  const suggestions = weakest.length
    ? weakest.map((dimension) => `- ${copy[dimension.questionId]?.suggestion}`)
    : ["- Conserva la precisión actual y elimina cualquier frase que no ayude a construir o comprobar el cambio."];
  const question = weakest[0]
    ? `¿Cómo puedes hacer más comprobable el criterio de ${copy[weakest[0].questionId]?.name.toLowerCase()} en tu siguiente versión?`
    : "¿Puedes mantener estos criterios usando menos texto y sin perder información comprobable?";

  return {
    text: [
      `Puntaje: ${Math.round(score.total)}/100`,
      `Elegibilidad: ${resolveEligible(score) ? "Elegible" : "No elegible"}`,
      `Fortaleza: ${strength}`,
      "Problemas prioritarios:",
      ...problems,
      "Sugerencias:",
      ...suggestions,
      `Pregunta: ${question}`,
    ].join("\n"),
    metadata: {
      kind: "template",
      version: isMission2 ? FEEDBACK_TEMPLATE_M2_V1 : FEEDBACK_TEMPLATE_M1_V1,
    },
  };
}
