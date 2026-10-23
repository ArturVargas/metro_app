# Workflows para PRs participantes

Los checks de PR hacia `dev` definidos por ADR-0011 viven en `.github/workflows/participant-pr-checks.yml` y `.github/workflows/participant-pr-description.yml`. `game-checks.yml` ignora los PRs hacia `dev` (`branches-ignore: [dev]`).

## Dónde deben estar

Un workflow de `pull_request` se lee del commit de merge del PR (rama base + cambios del PR). Por eso deben existir en `dev`, no solo en `main`:

1. `main`: llegan con esta rama. El check de descripción usa el SHA controlado de la rama base del PR.
2. `dev`: los mismos tres archivos de `.github/workflows/` y el checker mínimo de la descripción en dos commits de tooling sobre `2e3f805b7360d390de11e323a89ca77c8802a309`. El segundo fija el checker al SHA de la base. Su SHA es el que se publica para la Misión 3: `acd8258ce3dcc45f01c449e47204b10aa7e45b7f`.

## Checks

| Workflow | Job (nombre del check) | Eventos | Qué ejecuta |
| --- | --- | --- | --- |
| `participant-pr-checks.yml` | `Lint, typecheck and web build` | opened, synchronize, reopened | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build:web` sobre el código del PR |
| `participant-pr-description.yml` | `PR description` | opened, edited, synchronize, reopened | `pnpm --filter @metro/community pr:check-body` con el código del SHA congelado de `dev` |

Los dos usan `permissions: contents: read`, `persist-credentials: false`, ningún secreto y ningún `pull_request_target`. `REQUIRED_CHECKS` en `apps/community/src/pr/github-pr.ts` usa esos nombres de job.

El check de descripción hace checkout de `github.event.pull_request.base.sha`: así el PR no puede cambiar su propio validador y todos los participantes de la misión usan la misma versión aunque `main` avance.

## Límites conocidos

- El participante puede editar un workflow dentro de su PR y ese cambio se ejecuta en su PR. No obtiene secretos ni escritura, pero podría hacer que un check pase. Por eso `rubric-m3-v1` aplica `protected-path` a `.github/`, y el backend vuelve a leer la descripción con su propio parser.
- Con la configuración por defecto de GitHub, el primer PR de una cuenta nueva necesita que alguien del equipo apruebe la ejecución de los workflows. Revisa el código antes de aprobar.
