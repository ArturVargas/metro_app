# GitHub Project — contexto operativo

## Cuándo usar este documento

Lee este documento antes de crear, consultar o sincronizar misiones y prompts en el Project comunitario. El historial autoritativo permanece en GitHub Issues; el Project contiene el estado operativo reconstruible.

## Project activo

- Nombre: `Metro App — Community Experiment`
- Propietario: `ArturVargas`
- Número: `1`
- URL: https://github.com/users/ArturVargas/projects/1
- Visibilidad: privada
- Repositorio vinculado: `ArturVargas/metro_app`
- Verificado: 2026-10-01 mediante las API de GitHub Projects

## Misión preparada

- Issue: [#50 — Mission mission-m3 · Misión 3](https://github.com/ArturVargas/metro_app/issues/50)
- `Item type`: `Mission`
- `Mission`: `mission-m3`
- `Status`: `Planned` hasta su apertura el 30 de octubre de 2026; después cambia a `Active`

Verificado el 27 de octubre de 2026 mediante GraphQL después de agregar el Issue y guardar sus tres campos. El Issue sintético cerrado `#12` no pertenece al Project.

## Campos exactos

| Campo | Tipo | Opciones |
| --- | --- | --- |
| `Title` | integrado | título del Issue |
| `Status` | single select | `Planned`, `Active`, `Voting`, `Building`, `Published`, `Closed` |
| `Item type` | single select | `Mission`, `Prompt` |
| `Mission` | text | identificador estable |
| `Participant` | text | identificador seudónimo |
| `Attempts` | number | `0–5` |
| `Latest score` | number | `0–100` |
| `Eligible` | single select | `Not evaluated`, `Yes`, `No` |
| `Voting` | single select | `Not eligible`, `Candidate`, `Tie-break`, `Selected`, `Not selected` |
| `Final votes` | number | total después del cierre |
| `Variant` | single select | `Unassigned`, `A`, `B`, `C` |
| `Branch` | text | nombre de rama |
| `Pull request` | text | URL del PR |
| `Preview` | text | URL publicada |
| `Queue state` | single select | `draft`, `evaluating`, `needs-revision`, `technical-queue`, `approved`, `selected-a`, `selected-b`, `selected-c`, `not-selected` (Misión 3) |
| `Evaluated SHA` | text | SHA del head evaluado en el último intento (Misión 3) |
| `Head SHA` | text | head actual del PR (Misión 3) |
| `Base SHA` | text | SHA de `dev` declarado (Misión 3) |
| `Change origin` | single select | `LLM`, `Manual`, `Combined` (Misión 3) |
| `Checks` | single select | `Pending`, `Success`, `Failure` (Misión 3) |
| `Queued at` | text | fecha ISO en que el SHA calificó (Misión 3) |

Los campos de Misión 3 se crearon el 2026-10-22 con `pnpm --filter @metro/community project:ensure-m3-fields --apply`, que solo agrega campos que faltan. En Misión 3, `Pull request` guarda la URL del PR y la sincronización escribe los campos de cola en lugar de `Voting`. `Queue state` se deriva de los intentos, los checks y las etiquetas `review:approved`, `review:changes-requested` y `slot:a|b|c|none` (`apps/community/src/pr/queue.ts`).

Las etiquetas de revisión y de ranura solo se asignan cuando el PR sigue abierto, el SHA evaluado coincide con el head, el puntaje califica y los checks están en verde. Después de asignar `slot:a`, `slot:b` o `slot:c`, cerrar el PR participante no libera la ranura ni cambia su estado `selected-*`; el SHA, puntaje y checks siguen siendo obligatorios. Un PR cerrado sin ranura queda `not-selected`. `Queued at` conserva la primera hora en que ese mismo SHA tuvo todos los checks requeridos en verde; volver a ejecutar un check no cambia su posición.

## Vistas

- `Misiones`: board con filtro `item-type:Mission`.
- `Prompts`: table con filtro `item-type:Prompt`; muestra `Title`, `Mission`, `Participant`, `Attempts`, `Latest score`, `Eligible` y `Voting`.
- `Finalistas A/B/C`: table con filtro `voting:Selected`; muestra `Title`, `Variant`, `Participant`, `Latest score`, `Final votes`, `Branch`, `Pull request` y `Preview`.
- `Todos`: table sin filtro para administración y recuperación de elementos ocultos por los filtros operativos.

## Cómo lo usan los agentes

1. Leer `experiment-rules.md`, el contrato de la misión y ADR-0002.
2. Persistir y confirmar primero el comentario del intento en el Issue participante×misión.
3. Usar el Issue como clave del item y actualizar la misma fila; nunca crear una fila por intento.
4. Derivar `Attempts`, `Latest score`, `Eligible` y `Voting` del último intento válido.
5. Si la sincronización falla, conservar el intento y ejecutar reconciliación desde Issues.
6. No escribir `Final votes`, `Variant` ni enlaces de ejecución antes de la operación supervisada correspondiente.

Nunca guardar teléfonos, tokens, identificadores crudos de WhatsApp ni el prompt completo en campos del Project.

## Autenticación

- `GITHUB_TOKEN`: fine-grained PAT para Issues de `metro_app`.
- `GITHUB_PROJECT_TOKEN`: classic PAT de `ArturVargas` con scope `project` para el Project personal.
- `GITHUB_PROJECT_OWNER=ArturVargas` y `GITHUB_PROJECT_NUMBER=1`: configuración que consumirá el adaptador.

Las credenciales viven fuera del repositorio y nunca deben aparecer en logs, Issues o commits.

## Skills relacionados

- `architecture-workflow`: cambios en el flujo Issues → Project o en sus fronteras.
- `superpowers:test-driven-development`: parsers, snapshots, idempotencia y reconciliación.
- `superpowers:systematic-debugging`: duplicados, drift o fallos de la API REST.

## Dónde encontrar el contexto

- Diseño aprobado: `docs/superpowers/specs/2026-10-01-github-community-project-design.md`.
- Plan de implementación: `docs/superpowers/plans/2026-10-01-github-community-project.md`.
- Fuente de verdad: `.ai/adr/0002-github-as-community-system-of-record.md`.
- Convención de intentos: `.ai/adr/0007-github-attempt-issue-comment-convention.md`.
- Persistencia actual: `apps/community/src/github/`.
- Evaluación: `packages/evaluation/`.

Actualiza este documento si cambia el número, URL, nombre de un campo, opción o vista. Los nombres son contrato de integración.
