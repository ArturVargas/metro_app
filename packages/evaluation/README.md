# `@metro/evaluation`

Typed rubric, question definitions, composite Score scoring, and validation for the community prompt experiment.

## Status

**Spike.** This package does **not** call the TypeSafe Jev API and must not contain secrets, tokens, or live credentials.

See [ADR-0006](../../.ai/adr/0006-jev-backend-integration.md) for the Jev ↔ backend contract.

## Ownership

| Concern | Owner |
| --- | --- |
| Rubric versions, Score questions, scoring 0–100, validation | `@metro/evaluation` |
| Orchestration (window, attempts, Hermes, GitHub, LLM feedback) | `apps/community` (not fully built yet) |
| Typed decisions only (`Noul` / `Choice` / `Score`) | TypeSafe Jev (via a future adapter here) |

## Composite scoring

- Rubric dimensions are **parallel `Score` questions** (levels **0–4** with situational criteria arrays).
- Normalize each level: `level / 4` → **0–1**.
- Apply **weights** (placeholder equal weights summing to 1 in v0; authoritative weights are **versioned per mission**).
- Weighted sum × 100 → mission total **0–100** in code (`scoreFromAnswers`).
- **Confidence** on `Choice` / `Score` (`high` / `medium` / `low`) is **routing metadata** only → `auto` / `caution` / `defer`. It does not change the total.
- **`Noul` has no confidence**; use **probability bands** for routing instead.
- WhatsApp **never names Jev**.

## Attempt limit

- **5 evaluaciones por misión por participante** (`MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT`).
- Individual counter per participant per mission — **not** a shared cap of 5 for the mission or group.

## Public surface (current)

- Discriminated `Question` types (`NoulQuestion` / `ChoiceQuestion` / `ScoreQuestion` with `criteria` arrays)
- Placeholder rubric `v0`: four Score dimensions — specificity, verifiability, scope/limits, actionable acceptance (generic prompt quality; **no mission solution hints**)
- `scoreFromAnswers` → 0–100 composite + routing metadata
- `validateEvaluationState` / `validateAnswersForQuestions`

## What not to do

- Do not add TypeSafe SDK calls or env-based secrets in this spike.
- Do not mention Jev in participant-facing WhatsApp copy (Hermes / community messaging).
- Do not wire this package into `@metro/game`; game CI must stay independent.
