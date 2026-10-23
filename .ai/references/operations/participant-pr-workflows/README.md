# Workflows pendientes para PRs participantes

Estos archivos son los checks de PR hacia `dev` definidos por ADR-0011. No están en `.github/workflows/` porque el token que preparó la rama no tiene el scope `workflow`. Una persona con ese permiso debe copiarlos.

## Dónde instalarlos

Un workflow de `pull_request` se lee del commit de merge del PR (rama base + cambios del PR). Por eso deben existir en `dev`, no solo en `main`:

1. `main`: copiar `participant-pr-checks.yml` y `participant-pr-description.yml` a `.github/workflows/` y aplicar `game-checks-skip-dev.patch`. El check de descripción usa el código de `main`.
2. `dev`: añadir los mismos dos archivos y el patch en un commit sobre `2e3f805b7360d390de11e323a89ca77c8802a309`. Ese commit cambia solo `.github/` y su SHA es el que se publica como base de la Misión 3.

## Checks

| Workflow | Job (nombre del check) | Eventos | Qué ejecuta |
| --- | --- | --- | --- |
| `participant-pr-checks.yml` | `Lint, typecheck and web build` | opened, synchronize, reopened | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build:web` sobre el código del PR |
| `participant-pr-description.yml` | `PR description` | opened, edited, synchronize, reopened | `pnpm --filter @metro/community pr:check-body` con el código de la rama por defecto |

Los dos usan `permissions: contents: read`, `persist-credentials: false`, ningún secreto y ningún `pull_request_target`. `REQUIRED_CHECKS` en `apps/community/src/pr/github-pr.ts` usa esos nombres de job.

## Límites conocidos

- El participante puede editar un workflow dentro de su PR y ese cambio se ejecuta en su PR. No obtiene secretos ni escritura, pero podría hacer que un check pase. Por eso `rubric-m3-v1` aplica `protected-path` a `.github/`, y el backend vuelve a leer la descripción con su propio parser.
- Con la configuración por defecto de GitHub, el primer PR de una cuenta nueva necesita que alguien del equipo apruebe la ejecución de los workflows. Revisa el código antes de aprobar.
