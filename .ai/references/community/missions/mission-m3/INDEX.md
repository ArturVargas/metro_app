# Misión 3 — índice y guía de contexto

## Cómo usar esta sección

En Misión 3 cada participante abre un PR desde su fork hacia `dev`. TypeSafe califica la correspondencia entre el prompt del PR y el diff con `rubric-m3-v2` ([ADR-0011](../../../../adr/0011-participant-forks-and-pr-qualification.md)).

## Orden de lectura

1. [`public-brief.md`](public-brief.md): brief público de "Pasajeros en espera". Borrador para aprobación de Artur; no publicado.
2. [`internal-contract.md`](internal-contract.md): contrato interno, calendario (apertura aprobada; cierre y Misiones 4–5 en propuesta) y mapeo de criterios a la rúbrica M3.
3. [Diseño](../../../../../docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md) y [plan](../../../../../docs/superpowers/plans/2026-10-24-mission-3-passengers.md) de la misión.
4. [`calibration-2026-10-26-passengers.md`](calibration-2026-10-26-passengers.md): resumen de la calibración con casos débil, medio y fuerte de pasajeros (`ready` con `rubric-m3-v2`; solo puntajes).
5. [`calibration-2026-10-22-rubric-m3-v1.md`](calibration-2026-10-22-rubric-m3-v1.md): calibración general de la rúbrica y del umbral 80.
6. [`public-message-draft.md`](public-message-draft.md): mensaje de WhatsApp y guía de fork/PR con fechas. No enviado; pendiente de aprobación.
7. [`../../github-project.md`](../../github-project.md): campos de cola del Project.
8. [`../../../operations/participant-pr-workflows/`](../../../operations/participant-pr-workflows/README.md): checks de PR hacia `dev` (en `.github/workflows/` de `main` y `dev`).
9. [`../../../operations/hermes-m3/`](../../../operations/hermes-m3/README.md): cambios de Hermes pendientes de aplicar en el VPS.

## Base de la misión

`dev` está fijo en `acd8258ce3dcc45f01c449e47204b10aa7e45b7f`: el segundo commit de tooling sobre `2e3f805` (versión B de Misión 2). Añade los workflows de PR, el checker mínimo de la descripción y lo fija al SHA de la base. Es el `M3_DEV_SHA` y el SHA base que declaran los PRs.

## Diseño de misiones

Cada misión se diseña para un PR pequeño de alcance acotado: un comportamiento principal, pocos archivos y un diff de pocos cientos de líneas. La calibración mostró que TypeSafe no da fidelidad 3 o más a diffs de 20–30 KB aunque el código cumpla, así que con misiones grandes el umbral de 80 no puede alcanzarse. Si una misión necesita más trabajo, se parte en varias misiones.

## Decisiones (2026-10-22)

- **Core gap = 0:** si cobertura o fidelidad queda en nivel 2 o menos, el total es 0. TypeSafe devuelve igual todos los niveles y el feedback completo. Los demás hard-fails (inyección, texto oculto, ruta protegida, diff vacío, diff demasiado grande) topan el total en 80.
- **Mismo SHA:** no se reevalúa un SHA ya evaluado; hace falta un commit nuevo.
- **Rutas protegidas:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `.nvmrc` siguen protegidos junto con `.github/`, `apps/community/`, `packages/evaluation/` y `.env`.
- **Identificador:** `p-` seguido de los últimos 3 dígitos del teléfono del participante; quienes tienen sufijo de colisión (por ejemplo `p-123b`) ya lo recibieron. El login de GitHub no tiene que coincidir con el participante; no hay registro de logins.
- **Fechas (2026-10-26):** Misión 3 abre el viernes 30 de octubre de 2026. Cierre de Misión 3 y fechas de Misiones 4 y 5 en propuesta; ver [`internal-contract.md`](internal-contract.md#2-calendario).

## Estado antes de publicar

- Brief, contrato y mensaje: borrador para aprobación de Artur.
- Calibración de pasajeros: **`ready` con `rubric-m3-v2`**: el caso fuerte califica en 13 de 13 corridas (81.9–84.4, media 83.3); débil, medio y la variante con una desviación quedan en 0. Requiere mergear `feat/m3-continuous-scoring`. Los fixtures son privados (solo en el VPS). Ver [`calibration-2026-10-26-passengers.md`](calibration-2026-10-26-passengers.md).
- Ensayo desde fork: PR [#47](https://github.com/ArturVargas/metro_app/pull/47) hacia `dev` (no mergear).
- Pendientes: confirmar fechas en propuesta, Issue principal en el Project, aplicar Hermes en el VPS y activar `mission-m3`, publicar en WhatsApp.

## Código

- Rúbrica y política: `packages/evaluation/src/rubrics/m3-v1.ts`, `packages/evaluation/src/m3-policy.ts`.
- PR: `apps/community/src/pr/` (`body.ts`, `prepare.ts`, `queue.ts`, `github-pr.ts`).
- CLIs: `evaluate:pr`, `pr:check-body`, `project:ensure-m3-fields`.
