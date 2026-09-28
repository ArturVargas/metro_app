# Verification — Task 2: Neutral station board

**Date:** 2026-09-28  
**Branch:** `feat/neutral-station-board`  
**Scope:** Task 2 only (StationBoard + App shell). No CI (Task 3).

## Commands

| Command | Result |
| --- | --- |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm build:web` | exit 0 — `apps/game/dist/index.html` exported |

## Visual check

Visual review of `apps/game/dist` at 390×844 and 1280×800 **will follow on preview** before opening the PR. Confirm then: eight stations visible, no horizontal overflow, no overlaps, no interactive controls.

## Notes

- Eight fixed stations with `circle` / `triangle` / `square`.
- `accessibilityLabel` format: `Estación N, <forma>` (círculo / triángulo / cuadrado).
- No lines, trains, passengers, or game mechanics.
