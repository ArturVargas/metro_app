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
- Verificado: 2026-10-01 mediante GitHub GraphQL

## Misión activa

- Issue: [#14 — Mission mission-m1 · Misión 1](https://github.com/ArturVargas/metro_app/issues/14)
- `Item type`: `Mission`
- `Mission`: `mission-m1`
- `Status`: `Active`

El Issue sintético cerrado `#12` no pertenece al Project.

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
- `superpowers:systematic-debugging`: duplicados, drift o fallos de GraphQL.

## Dónde encontrar el contexto

- Diseño aprobado: `docs/superpowers/specs/2026-10-01-github-community-project-design.md`.
- Plan de implementación: `docs/superpowers/plans/2026-10-01-github-community-project.md`.
- Fuente de verdad: `.ai/adr/0002-github-as-community-system-of-record.md`.
- Convención de intentos: `.ai/adr/0007-github-attempt-issue-comment-convention.md`.
- Persistencia actual: `apps/community/src/github/`.
- Evaluación: `packages/evaluation/`.

Actualiza este documento si cambia el número, URL, nombre de un campo, opción o vista. Los nombres son contrato de integración.
