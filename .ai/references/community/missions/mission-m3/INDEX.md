# Misión 3 — índice y guía de contexto

## Cómo usar esta sección

En Misión 3 cada participante abre un PR desde su fork hacia `dev`. TypeSafe califica la correspondencia entre el prompt del PR y el diff con `rubric-m3-v1` ([ADR-0011](../../../../adr/0011-participant-forks-and-pr-qualification.md)).

## Orden de lectura

1. `public-brief.md`: pendiente; lo define Artur.
2. [`public-message-draft.md`](public-message-draft.md): mensaje de WhatsApp y guía de fork/PR. No enviado.
3. [`calibration-2026-10-22-rubric-m3-v1.md`](calibration-2026-10-22-rubric-m3-v1.md): calibración de la rúbrica y del umbral 80.
4. [`../../github-project.md`](../../github-project.md): campos de cola del Project.
5. [`../../../operations/participant-pr-workflows/`](../../../operations/participant-pr-workflows/README.md): checks de PR pendientes de instalar.
6. [`../../../operations/hermes-m3/`](../../../operations/hermes-m3/README.md): cambios de Hermes pendientes de aplicar.

## Código

- Rúbrica y política: `packages/evaluation/src/rubrics/m3-v1.ts`, `packages/evaluation/src/m3-policy.ts`.
- PR: `apps/community/src/pr/` (`body.ts`, `prepare.ts`, `queue.ts`, `github-pr.ts`).
- CLIs: `evaluate:pr`, `pr:check-body`, `project:ensure-m3-fields`.
