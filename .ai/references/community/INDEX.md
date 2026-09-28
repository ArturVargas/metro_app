# Comunidad — índice y guía de contexto

## Cuándo usar esta sección

Lee esta sección para misiones, intentos, evaluación de prompts, feedback, votación, variantes A/B/C o la interacción de Hermes en WhatsApp.

## Orden de lectura

1. [`experiment-rules.md`](experiment-rules.md) para reglas confirmadas y preguntas abiertas.
2. [`participant-onboarding.md`](participant-onboarding.md) para el contexto y las instrucciones que recibe el grupo.
3. [`mission-structure.md`](mission-structure.md) para entender las dos capas de cada misión.
4. [`mission-public-brief-template.md`](mission-public-brief-template.md) para redactar y revisar el mensaje público de una misión.
5. [`mission-internal-contract-template.md`](mission-internal-contract-template.md) para configurar evaluación, ejecución, trazabilidad y publicación.
6. [`missions/mission-m1/`](missions/mission-m1/) para el brief público y el contrato interno de la Misión 1 (`mission-m1` v1, rúbrica `rubric-m1-v1` en `packages/evaluation`).
7. [ADR-0001](../../adr/0001-prompt-evaluation-and-variant-experiment.md) para la razón del pipeline Jev + LLM + A/B/C.
8. [ADR-0002](../../adr/0002-github-as-community-system-of-record.md) para persistencia y auditoría.
9. [ADR-0003](../../adr/0003-hermes-as-whatsapp-group-adapter.md) para la frontera con WhatsApp.
10. [ADR-0005](../../adr/0005-cloudflare-abc-preview-slots.md) para hosting de ranuras A/B/C y reglas de promoción al baseline.
11. [ADR-0006](../../adr/0006-jev-backend-integration.md) para el contrato Jev ↔ backend, rúbrica en `packages/evaluation` y flujo de evaluación.
12. [Mapa de arquitectura](../architecture/system-map.md) si se modifican contratos entre componentes.

## Skills relacionados

- `superpowers:brainstorming`: cambios en reglas de participación o votación.
- `architecture-workflow`: cambios en Jev, GitHub, Hermes, identidad o ejecución de agentes.
- `superpowers:test-driven-development`: puntaje, límite de intentos, elegibilidad, voto y asignación A/B/C.
- `superpowers:systematic-debugging`: fallos de webhooks, duplicados, comentarios o sincronización.

## Reglas de actualización

Registra aquí una regla solo después de su aprobación explícita. Si cambia el contrato entre sistemas, actualiza también el ADR y el mapa de arquitectura. Conserva las preguntas abiertas hasta que una decisión las cierre.
