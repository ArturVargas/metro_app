# `@metro/evaluation`

Typed rubric, question definitions, scoring, and validation for the community prompt experiment.

## Status

**Spike / skeleton only.** This package does **not** call the TypeSafe Jev API and must not contain secrets, tokens, or live credentials.

See [ADR-0006](../../.ai/adr/0006-jev-backend-integration.md) for the Jev ↔ backend contract.

## Ownership

| Concern | Owner |
| --- | --- |
| Rubric versions, question defs, scoring 0–100, validation | `@metro/evaluation` |
| Orchestration (window, attempts, Hermes, GitHub, LLM feedback) | `apps/community` (not fully built yet) |
| Typed decisions only (`Noul` / `Choice` / `Score`) | TypeSafe Jev (via a future adapter here) |

## Public surface (current)

- `Question`, `EvaluationState`, `Answer` types
- Placeholder rubric `v0` with example Noul/Choice questions (generic prompt quality; no mission solutions)
- `scoreFromAnswers` stub (returns a placeholder until the formula is closed)

## What not to do

- Do not add TypeSafe SDK calls or env-based secrets in this spike.
- Do not mention Jev in participant-facing WhatsApp copy (Hermes / community messaging).
- Do not wire this package into `@metro/game`; game CI must stay independent.
