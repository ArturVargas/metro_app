# ADR-0001: Evaluación de prompts y variantes A/B/C

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** el experimento debe mejorar la calidad de los prompts y demostrar su efecto sobre un producto jugable.

## Decisión

TypeSafe Jev evalúa una rúbrica versionada y el backend calcula una puntuación de 0 a 100. Un LLM ligero redacta feedback a partir de esos resultados sin modificar la puntuación. Cada participante dispone de hasta cinco intentos; la versión calificable más reciente entra a votación si alcanza 70 puntos.

La puntuación solo habilita la candidatura. La comunidad elige tres prompts, que se asignan aleatoriamente a A, B y C. Las tres variantes se ejecutan desde el mismo commit con condiciones equivalentes y quedan vinculadas al autor y al texto exacto del prompt. La integración final requiere aprobación técnica.

## Alternativas consideradas

- LLM como juez: rechazado por variabilidad y riesgo de feedback que altera el criterio.
- Elegir automáticamente los puntajes más altos: rechazado porque la selección final pertenece a la comunidad.
- Ejecutar una sola propuesta: rechazado porque no permite comparar el efecto de distintos prompts.

## Consecuencias

- La rúbrica, fórmula, modelo y prompt de feedback deben versionarse.
- La ejecución necesita aislamiento y paridad entre variantes.
- Debe conservarse evidencia que conecte prompt, participante, issue, rama, PR y preview.

## Reabrir si

- Jev no alcanza concordancia suficiente con revisiones humanas.
- El costo o la latencia impiden feedback dentro del ritmo del grupo.
- La comparación A/B/C no puede aislar las condiciones de ejecución.
