# ADR-0006: Integración Jev ↔ backend

- **Estado:** aceptada
- **Fecha:** 2026-09-28
- **Contexto:** ADR-0001 fijó que Jev evalúa y el LLM explica; hace falta delimitar el contrato de integración entre TypeSafe Jev, el backend, Hermes y `packages/evaluation` antes de implementar llamadas reales.

## Decisión

### Responsabilidades

- **Jev** solo produce decisiones tipadas (`Noul`, `Choice`, `Score`). No calcula el umbral de elegibilidad, no asigna la puntuación 0–100 y no redacta feedback para participantes.
- **El backend** (vía `apps/community`, cuando exista) posee umbrales, la conversión a puntuación 0–100, validación de ventana e intentos, persistencia en GitHub y el orquestado del flujo.
- **El LLM** solo redacta feedback a partir de hallazgos ya calculados; si falla o el formato es inválido, se usa una plantilla versionada. No altera la puntuación ni añade criterios.
- **Hermes** es el adaptador del grupo de WhatsApp: transmite mención, identidad seudónima y mensaje; publica la respuesta estructurada que recibe del backend. No evalúa ni modifica puntajes.
- **WhatsApp nunca nombra Jev.** La comunicación a participantes habla de evaluación de calidad y feedback.

### Flujo de evaluación

1. Mención explícita al bot en el grupo.
2. Validar ventana (martes/jueves) e intentos restantes (máximo cinco por misión).
3. Construir el estado de evaluación: brief público de la misión + prompt del participante.
4. Derivar preguntas Jev desde la rúbrica versionada (criterios atómicos).
5. Obtener respuestas tipadas de Jev.
6. Calcular la puntuación 0–100 en código (`packages/evaluation`), no en el LLM ni en Hermes.
7. Generar feedback con LLM o plantilla de respaldo.
8. Persistir intento, puntaje, feedback y metadatos en GitHub (Issues/Projects).
9. Responder al grupo vía Hermes con el mensaje estructurado.

### Rúbrica y criterios

Cada criterio de la rúbrica se modela como una o más preguntas Jev atómicas, con criterios situacionales y opciones de escape cuando aplique. Los pesos viven en el contrato interno de la misión. La fórmula exacta de agregación a 100 puntos permanece abierta (ver condiciones de reapertura y reglas del experimento).

### Propiedad del código

- **`packages/evaluation`** posee versiones de rúbrica, definiciones de preguntas, scoring y validación de estado/respuestas. El spike inicial no llama a la API de TypeSafe ni introduce secretos.
- **`apps/community`** llamará a `packages/evaluation` para orquestar el flujo; esa app aún no está construida por completo.
- Secretos de TypeSafe, LLM, Hermes y GitHub no se versionan en el repositorio.

## Alternativas consideradas

- Dejar que Jev o el LLM calculen el 0–100: rechazado; la puntuación y los umbrales pertenecen al backend/`packages/evaluation`.
- Exponer el nombre o el detalle de Jev en WhatsApp: rechazado; el canal solo comunica calidad y feedback.
- Evaluar dentro del razonamiento libre de Hermes: rechazado (ADR-0003); falta reproducibilidad y auditoría.
- Colocar rúbrica y scoring dentro de `apps/community` sin paquete compartido: aplazado; el mapa del sistema ya reserva `packages/evaluation` para contratos y validación reutilizables.

## Consecuencias

- Antes de la Misión 1 hay que versionar rúbrica, pesos (cuando se cierren), prompt de feedback y plantilla de respaldo.
- El adaptador TypeSafe vive detrás de `packages/evaluation`; el resto del monorepo no importa SDKs ni secretos de Jev.
- `apps/community` depende de contratos tipados de este paquete, no de detalles de WhatsApp ni de Cloudflare.
- El CI del juego (`game-checks`) no debe depender de este paquete en tiempo de ejecución.

## Reabrir si

- Las decisiones tipadas de Jev no alcanzan concordancia suficiente con revisiones humanas (también ADR-0001).
- El costo o la latencia de Jev impiden feedback dentro del ritmo del grupo.
- La fórmula o los pesos de la rúbrica exigen un modelo distinto al de preguntas atómicas + agregación en código.
- Aparece un canal oficial distinto de Hermes que cambie el contrato de entrada/salida.
- Se necesita invocar TypeSafe desde otro paquete o app sin pasar por `packages/evaluation`.
