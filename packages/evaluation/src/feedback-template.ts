import { resolveEligible, type FeedbackMetadata } from "./attempt.js";
import type { ScoreResult } from "./types.js";

export const FEEDBACK_TEMPLATE_M1_V1 = "feedback-template-m1-v1" as const;
export const FEEDBACK_TEMPLATE_M2_V1 = "feedback-template-m2-v1" as const;
export const FEEDBACK_TEMPLATE_M3_V1 = "feedback-template-m3-v1" as const;

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

const M3_COPY: FeedbackCopy = {
  "requirement-coverage": {
    name: "Cobertura del prompt",
    strength: "El código implementa los requisitos que pide tu prompt.",
    problem: "Hay requisitos del prompt que el código no implementa o que solo aparecen como nombres, comentarios o funciones vacías.",
    suggestion: "Recorre tu prompt requisito por requisito y comprueba en el juego que cada uno ocurre de verdad.",
  },
  "behavioral-fidelity": {
    name: "Comportamiento",
    strength: "El comportamiento coincide con los valores y condiciones de tu prompt.",
    problem: "El código hace algo distinto a lo que dice el prompt en algunos valores, condiciones o casos límite.",
    suggestion: "Compara cada número, texto y condición del prompt con lo que ves al probar el juego.",
  },
  "scope-fidelity": {
    name: "Alcance",
    strength: "El cambio se limita a lo que pide el prompt y respeta los límites de la misión.",
    problem: "El PR incluye cambios que el prompt no pide o toca partes que la misión protege.",
    suggestion: "Quita del PR lo que el prompt no pide y conserva lo que la misión dice que debe mantenerse.",
  },
  "verification-evidence": {
    name: "Evidencia de pruebas",
    strength: "Las pruebas declaradas comprueban el comportamiento pedido.",
    problem: "Las pruebas declaradas no demuestran que el comportamiento pedido funciona.",
    suggestion: "Escribe en el PR cada prueba que hiciste, qué esperabas y qué resultado obtuviste.",
  },
  traceability: {
    name: "Origen de los cambios",
    strength: "La declaración LLM/manual/combinado es clara y coincide con el código.",
    problem: "La declaración de origen no explica qué partes cambiaste a mano.",
    suggestion: "Indica qué cambios generó el LLM, cuáles hiciste a mano y por qué.",
  },
};

const M3_HARD_FAIL_COPY: Record<string, string> = {
  "evaluator-injection": "El PR contiene texto dirigido a quien evalúa. Quítalo; no cuenta como evidencia.",
  "hidden-text": "El prompt o el código contienen texto oculto o caracteres invisibles. Quítalos.",
  "protected-path": "El PR modifica archivos protegidos (checks, evaluación, dependencias o configuración).",
  "empty-diff": "El PR no contiene cambios de código.",
  "diff-too-large": "El cambio es demasiado grande para evaluarlo completo. Redúcelo a lo que pide el prompt.",
  "core-gap": "El código todavía no hace lo que pide el prompt en sus requisitos principales.",
};

export function buildTemplateFeedback(
  score: ScoreResult,
  hardFails: readonly string[] = [],
): {
  text: string;
  metadata: FeedbackMetadata;
} {
  const isMission2 = score.rubricVersion === "rubric-m2-v1";
  const isMission3 = score.rubricVersion === "rubric-m3-v1";
  const copy = isMission3 ? M3_COPY : isMission2 ? M2_COPY : M1_COPY;
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
  const policyProblems = hardFails
    .map((id) => M3_HARD_FAIL_COPY[id])
    .filter((text): text is string => Boolean(text))
    .slice(0, 2)
    .map((text) => `- ${text}`);
  const dimensionProblems = weakest.map((dimension) => `- ${copy[dimension.questionId]?.name}: ${copy[dimension.questionId]?.problem}`);
  const problems = policyProblems.length
    ? policyProblems
    : dimensionProblems.length
      ? dimensionProblems
      : ["- No hay problemas prioritarios en esta evaluación."];
  const dimensionSuggestions = weakest.length
    ? weakest.map((dimension) => `- ${copy[dimension.questionId]?.suggestion}`)
    : ["- Conserva la precisión actual y elimina cualquier frase que no ayude a construir o comprobar el cambio."];
  const suggestions = policyProblems.length
    ? policyProblems.map((_, index) => dimensionSuggestions[index] ?? "- Corrige el punto anterior y solicita una nueva evaluación.")
    : dimensionSuggestions;
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
      version: isMission3
        ? FEEDBACK_TEMPLATE_M3_V1
        : isMission2
          ? FEEDBACK_TEMPLATE_M2_V1
          : FEEDBACK_TEMPLATE_M1_V1,
    },
  };
}
