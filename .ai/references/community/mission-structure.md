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

## Reglas de consistencia

- Las dos capas usan el mismo identificador y versión.
- Los criterios públicos deben corresponder con verificaciones internas.
- La rúbrica evalúa la calidad del prompt, no si propone la solución técnica preferida por el equipo.
- Ninguna instrucción interna puede ampliar silenciosamente el alcance publicado.
- Un cambio posterior a la publicación crea una nueva versión de la misión y se comunica al grupo.

## Estado

La separación en dos capas y la plantilla detallada del brief público están aprobadas. La plantilla del contrato interno todavía debe diseñarse y aprobarse.
