# Misión 3 — índice y guía de contexto

## Cómo usar esta sección

En Misión 3 cada participante abre un PR desde su fork hacia `dev`. TypeSafe califica la correspondencia entre el prompt del PR y el diff con `rubric-m3-v2` ([ADR-0011](../../../../adr/0011-participant-forks-and-pr-qualification.md)).

## Orden de lectura

1. [`public-brief.md`](public-brief.md): brief público aprobado de "Pasajeros en espera"; pendiente de publicación.
2. [`internal-contract.md`](internal-contract.md): contrato interno, calendario aprobado, decisiones registradas y mapeo de criterios a la rúbrica M3.
3. [Diseño](../../../../../docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md) y [plan](../../../../../docs/superpowers/plans/2026-10-24-mission-3-passengers.md) de la misión.
4. [`calibration-2026-10-26-passengers.md`](calibration-2026-10-26-passengers.md): resumen de la calibración con casos débil, medio y fuerte de pasajeros (`ready` con `rubric-m3-v2`; solo puntajes).
5. [`calibration-2026-10-22-rubric-m3-v1.md`](calibration-2026-10-22-rubric-m3-v1.md): calibración general de la rúbrica y del umbral 80.
6. [`public-message-draft.md`](public-message-draft.md): mensaje de WhatsApp y guía de fork/PR aprobados. No enviados.
7. [`../../github-project.md`](../../github-project.md): campos de cola del Project.
8. [`../../../operations/participant-pr-workflows/`](../../../operations/participant-pr-workflows/README.md): checks de PR hacia `dev` (en `.github/workflows/` de `main` y `dev`).
9. [`../../../operations/hermes-m3/`](../../../operations/hermes-m3/README.md): cambios de Hermes, aplicados en el VPS el 2026-10-26.

## Base de la misión

`dev` está fijo en `1c60eea3b88962768dae0501e2cc9b8f20041b29`. Conserva el juego de la versión B de Misión 2 e incorpora mediante el PR [#51](https://github.com/ArturVargas/metro_app/pull/51) los workflows, el checker de la descripción y la infraestructura de evaluación de Misión 3. Es el `M3_DEV_SHA` y el SHA base que declaran los PRs.

## Diseño de misiones

Cada misión se diseña para un PR pequeño de alcance acotado: un comportamiento principal, pocos archivos y un diff de pocos cientos de líneas. La calibración mostró que TypeSafe no da fidelidad 3 o más a diffs de 20–30 KB aunque el código cumpla, así que con misiones grandes el umbral de 80 no puede alcanzarse. Si una misión necesita más trabajo, se parte en varias misiones.

## Decisiones (2026-10-22)

- **Core gap = 0:** si cobertura o fidelidad queda en nivel 2 o menos, el total es 0. TypeSafe devuelve igual todos los niveles y el feedback completo. Los demás hard-fails (inyección, texto oculto, ruta protegida, diff vacío, diff demasiado grande) topan el total en 80.
- **Mismo SHA:** no se reevalúa un SHA ya evaluado; hace falta un commit nuevo.
- **Rutas protegidas:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `.nvmrc` siguen protegidos junto con `.github/`, `apps/community/`, `packages/evaluation/` y `.env`.
- **Identificador:** `p-` seguido de los últimos 3 dígitos del teléfono del participante; quienes tienen sufijo de colisión (por ejemplo `p-123b`) ya lo recibieron. El login de GitHub no tiene que coincidir con el participante; no hay registro de logins.
- **Fechas (hora CDMX):** Misión 3 abre el viernes 30 de octubre de 2026 a las 06:00 hora CDMX y cierra el jueves 5 de noviembre a las 23:55 hora CDMX. Misión 4 abre el viernes 6 de noviembre y Misión 5 el viernes 13 de noviembre. Evaluaciones de martes a domingo, 06:00–23:55 hora CDMX. Calendario aprobado por Artur; ver decisiones D1, D4 y D7 en [`internal-contract.md`](internal-contract.md#decisiones-registradas).

## Estado antes de publicar

- Brief, contrato, calendario y mensaje: aprobados por Artur; pendientes de publicación.
- Calibración de pasajeros: **`ready` con `rubric-m3-v2`**: el caso fuerte califica en 16 de 16 corridas (81.9–85.4, media 83.5); débil, medio y la variante con una desviación quedan en 0. La implementación fue integrada mediante el PR [#48](https://github.com/ArturVargas/metro_app/pull/48). Los fixtures son privados (solo en el VPS). Ver [`calibration-2026-10-26-passengers.md`](calibration-2026-10-26-passengers.md).
- Ensayo desde fork: PR [#47](https://github.com/ArturVargas/metro_app/pull/47) cerrado sin mezclar después de comprobar los checks.
- Infraestructura en `dev`: PR [#51](https://github.com/ArturVargas/metro_app/pull/51) integrado; `apps/game` conserva el baseline B.
- Hecho: Hermes aplicado en el VPS (checkout en `e4e1b2d`), Issue principal [#50](https://github.com/ArturVargas/metro_app/issues/50) creado y agregado al Project con `Status = Planned`, y `M3_DEV_SHA` actualizado a `1c60eea3b88962768dae0501e2cc9b8f20041b29` en el VPS (2026-10-27).
- Pendientes: el 30 de octubre, activar `METRO_ACTIVE_MISSION=mission-m3` y `RECORD_ATTEMPTS=1`; publicar el mensaje en WhatsApp.

## Código

- Rúbrica y política: `packages/evaluation/src/rubrics/m3-v1.ts`, `packages/evaluation/src/m3-policy.ts`.
- PR: `apps/community/src/pr/` (`body.ts`, `prepare.ts`, `queue.ts`, `github-pr.ts`).
- CLIs: `evaluate:pr`, `pr:check-body`, `project:ensure-m3-fields`.
