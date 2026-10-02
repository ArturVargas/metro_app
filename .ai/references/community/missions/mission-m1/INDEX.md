# Misión 1 — índice y guía de contexto

## Cómo usar esta sección

Lee el brief público para conocer lo que recibe el grupo. Usa el contrato interno para configurar evaluación, ejecución y publicación. Consulta los reportes de calibración cuando cambien la rúbrica, el modelo solicitado o la forma de construir el contexto enviado al evaluador.

## Orden de lectura

1. [`public-brief.md`](public-brief.md): mensaje e instrucciones para participantes.
2. [`internal-contract.md`](internal-contract.md): fuente de verdad operativa de la misión.
3. [`calibration-2026-09-30.md`](calibration-2026-09-30.md): primera calibración en vivo de `rubric-m1-v1` con TypeSafe.
4. ADR-0009: `rubric-m1-v2` + política hard-fail de elegibilidad (default actual).
5. [`calibration-2026-10-01-m1-v2.md`](calibration-2026-10-01-m1-v2.md): calibración en vivo de v2 + hard-fail.
6. [`security-spike-2026-10-01.md`](security-spike-2026-10-01.md): probes de prompt injection en TypeSafe y revisión de la frontera de feedback.
7. [`persistence-verification-2026-10-01.md`](persistence-verification-2026-10-01.md): escritura real en GitHub e idempotencia del Issue de intentos.
8. [`execution-findings-2026-10-02.md`](execution-findings-2026-10-02.md): revisión de fidelidad, funcionamiento y seguridad de las variantes A, B y C.

## Skills relacionadas

- `superpowers:brainstorming`: diseño de controles o cambios en la experiencia de la misión.
- `architecture-workflow`: cambios de responsabilidades entre Jev, backend, LLM o GitHub.
- `superpowers:test-driven-development`: cambios de scoring, elegibilidad o límites de intentos.
- `superpowers:verification-before-completion`: evidencia de ejecución antes de aceptar una variante.
- `superpowers:systematic-debugging`: aislamiento de findings sin corregir automáticamente el resultado experimental.

## Regla de actualización

Un reporte de calibración aporta evidencia; no cambia por sí solo pesos, criterios ni el umbral. Registra esos cambios únicamente después de aprobación explícita y actualiza el contrato interno y el ADR correspondiente.
