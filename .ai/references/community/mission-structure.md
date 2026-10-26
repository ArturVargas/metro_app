# Estructura de misiones

## Cómo usar este documento

Usa esta referencia para crear cualquier misión del experimento. Cada misión debe producir dos artefactos vinculados que comparten identificador y versión. El brief público orienta a los participantes; el contrato interno permite evaluar y ejecutar de forma reproducible.

## Capa 1: brief público

La comunidad recibe:

- Nombre y número de la misión.
- Problema que observará el jugador.
- Objetivo del cambio.
- Contexto actual del producto.
- Qué puede modificarse.
- Qué debe permanecer igual.
- Criterios observables para comprobar el resultado.
- Instrucciones y fechas de participación.

El brief público debe dar contexto suficiente para escribir un prompt útil sin revelar la rúbrica interna ni imponer una solución técnica.

A medida que avance el experimento, una misión puede dar menos ejemplos y menos decisiones resueltas para medir si los participantes escriben prompts más completos. Todos los requisitos obligatorios siguen siendo públicos; la dificultad aumenta dejando abiertas decisiones de interacción, presentación y verificación, no ocultando condiciones de aprobación.

La plantilla aprobada está en [`mission-public-brief-template.md`](mission-public-brief-template.md). Contiene siete bloques variables —título, problema, objetivo, contexto, alcance permitido, elementos que deben mantenerse y criterios observables— más un pie fijo con las reglas de participación y la entrega del viernes.

## Capa 2: contrato interno

El sistema y los agentes reciben:

- Identificador y versión de la misión.
- Rúbrica y pesos de evaluación.
- Commit base y archivos relacionados.
- Pruebas obligatorias.
- Restricciones del agente de código.
- Presupuesto y condiciones iguales para A, B y C.
- Campos, etiquetas e issues de GitHub.
- Riesgos, rollback y aprobación final.

La plantilla aprobada está en [`mission-internal-contract-template.md`](mission-internal-contract-template.md). Organiza esta información en seis bloques: identidad, evaluación, código base, ejecución A/B/C, GitHub y publicación.

## Modalidad desde la Misión 3: entrega mediante PR

Las Misiones 3, 4 y 5 conservan brief público y contrato interno, pero reemplazan la ejecución central por una entrega del participante:

- SHA inmutable de `dev` como baseline;
- fork y rama propia;
- PR hacia `dev`;
- prompt exacto y declaración de autoría de cambios;
- checks y pruebas aportadas por el participante;
- evaluación Jev del par prompt↔código;
- revisión humana posterior al umbral;
- asignación cronológica A/B/C a los tres primeros PRs aprobados.

El contrato interno debe declarar su modalidad: `prompt-ejecutado` para M1–M2 o `participant-pr` para M3–M5. No mezcles reglas de votación de la primera fase con la cola de PRs de la segunda.

## Reglas de consistencia

- Las dos capas usan el mismo identificador y versión.
- Los criterios públicos deben corresponder con verificaciones internas.
- En `prompt-ejecutado`, la rúbrica evalúa la calidad del prompt. En `participant-pr`, evalúa la correspondencia entre el prompt declarado y el código del SHA revisado. Ninguna modalidad favorece la solución técnica preferida por el equipo.
- Ninguna instrucción interna puede ampliar silenciosamente el alcance publicado.
- Un cambio posterior a la publicación crea una nueva versión de la misión y se comunica al grupo.
- En modalidad `participant-pr`, todos los PRs comparables deben nacer del mismo SHA de `dev` y cualquier commit nuevo invalida la evaluación anterior para esa revisión.

## Estado

La separación en dos capas y las plantillas del brief público y del contrato interno están aprobadas.
