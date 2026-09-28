# Verification — Metro App technical baseline

**Date:** 2026-09-28  
**Branch (Task 3):** `ci/validate-universal-game-baseline`  
**Scope:** Tasks 1–3 closed. CI validates install, lint, types, and static web export. No preview hosting.

## Task 2 — Neutral station board

| Command | Result |
| --- | --- |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm build:web` | exit 0 — `apps/game/dist/index.html` exported |

Visual review of `apps/game/dist` at 390×844 and 1280×800 is recorded against the board scope: eight stations, no horizontal overflow, no overlaps, no interactive controls.

Notes:

- Eight fixed stations with `circle` / `triangle` / `square`.
- `accessibilityLabel` format: `Estación N, <forma>` (círculo / triángulo / cuadrado).
- No lines, trains, passengers, or game mechanics.

## Task 3 — Continuous validation

### Local commands

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm build:web` | exit 0 — `apps/game/dist/index.html` present |

### Scope review (`git diff` vs `main`)

Added only:

- `.github/workflows/game-checks.yml` — checkout, Node LTS, pnpm 8.10.0, frozen lockfile, lint, typecheck, `build:web`; no deploy.
- Doc updates in `.ai/references/game/technical-baseline.md` and this file.

Confirmed absent: game mechanics, backend, telemetry, hosting/preview service, empty packages, future-facing abstractions.

### Release decision

**Ready for merge** as the validation gate for the universal game baseline. Preview deployment remains explicitly out of scope until a later mission chooses a hosting provider.

## Cloudflare Base/A/B/C

Esta sección registra la configuración de hosting realizada después de cerrar el baseline.

| Comprobación | Resultado |
| --- | --- |
| Crear `metro-app-base` | Correcto |
| Crear `metro-app-a` | Correcto; sin deployment inicial |
| Crear `metro-app-b` | Correcto; sin deployment inicial |
| Crear `metro-app-c` | Correcto; sin deployment inicial |
| Desplegar Base desde `e765063f4ac3b0ceda1bb94158bac481fd106e6c` | Correcto |
| `curl -L https://metro-app-base.pages.dev/` | HTTP 200 |

La publicación inicial se ejecutó localmente y de forma supervisada con Wrangler 4.143.0. El workflow manual requiere configurar `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en GitHub antes de su primera ejecución.
