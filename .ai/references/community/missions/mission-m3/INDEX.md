# Misión 3 — índice y guía de contexto

## Cómo usar esta sección

En Misión 3 cada participante abre un PR desde su fork hacia `dev`. TypeSafe califica la correspondencia entre el prompt del PR y el diff con `rubric-m3-v1` ([ADR-0011](../../../../adr/0011-participant-forks-and-pr-qualification.md)).

## Orden de lectura

1. [`public-brief.md`](public-brief.md): stub; el brief funcional y las fechas están pendientes.
2. [`public-message-draft.md`](public-message-draft.md): mensaje de WhatsApp y guía de fork/PR. No enviado.
3. [`calibration-2026-10-22-rubric-m3-v1.md`](calibration-2026-10-22-rubric-m3-v1.md): calibración de la rúbrica y del umbral 80.
4. [`../../github-project.md`](../../github-project.md): campos de cola del Project.
5. [`../../../operations/participant-pr-workflows/`](../../../operations/participant-pr-workflows/README.md): checks de PR hacia `dev` (en `.github/workflows/` de `main` y `dev`).
6. [`../../../operations/hermes-m3/`](../../../operations/hermes-m3/README.md): cambios de Hermes pendientes de aplicar.

## Base de la misión

`dev` está fijo en `e402b2a1dbc7ed58c6ad3ad2c3485b41f2076cd4`: el commit CI-only sobre `2e3f805` (versión B de Misión 2) que añade los workflows de PR. Es el `M3_DEV_SHA` y el SHA base que declaran los PRs.

## Diseño de misiones

Cada misión se diseña para un PR pequeño de alcance acotado: un comportamiento principal, pocos archivos y un diff de pocos cientos de líneas. La calibración mostró que TypeSafe no da fidelidad 3 o más a diffs de 20–30 KB aunque el código cumpla, así que con misiones grandes el umbral de 80 no puede alcanzarse. Si una misión necesita más trabajo, se parte en varias misiones.

## Decisiones (2026-10-22)

- **Core gap = 0:** si cobertura o fidelidad queda en nivel 2 o menos, el total es 0. TypeSafe devuelve igual todos los niveles y el feedback completo. Los demás hard-fails (inyección, texto oculto, ruta protegida, diff vacío, diff demasiado grande) topan el total en 80.
- **Mismo SHA:** no se reevalúa un SHA ya evaluado; hace falta un commit nuevo.
- **Rutas protegidas:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `.nvmrc` siguen protegidos junto con `.github/`, `apps/community/`, `packages/evaluation/` y `.env`.
- **Identificador:** `p-` seguido de los últimos 3 dígitos del teléfono del participante; quienes tienen sufijo de colisión (por ejemplo `p-123b`) ya lo recibieron. El login de GitHub no tiene que coincidir con el participante; no hay registro de logins.
- **Fechas:** pendientes; fecha objetivo mencionada: viernes 30 de octubre de 2026.

## Código

- Rúbrica y política: `packages/evaluation/src/rubrics/m3-v1.ts`, `packages/evaluation/src/m3-policy.ts`.
- PR: `apps/community/src/pr/` (`body.ts`, `prepare.ts`, `queue.ts`, `github-pr.ts`).
- CLIs: `evaluate:pr`, `pr:check-body`, `project:ensure-m3-fields`.
