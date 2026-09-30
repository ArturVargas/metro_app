# `@metro/evaluation`

Typed rubric, question definitions, composite Score scoring, validation, and
**attempt result / comment formatting** helpers for the community prompt experiment.

## Status

**Spike.** This package does **not** call the TypeSafe Jev API and must not contain secrets, tokens, or live credentials.

See [ADR-0006](../../.ai/adr/0006-jev-backend-integration.md) for the Jev ↔ backend contract.
See [ADR-0007](../../.ai/adr/0007-github-attempt-issue-comment-convention.md) for GitHub issue/comment persistence.

## Ownership

| Concern | Owner |
| --- | --- |
| Rubric versions, Score questions, scoring 0–100, validation | `@metro/evaluation` |
| AttemptResult, tag helpers, comment markdown (pure) | `@metro/evaluation` |
| Orchestration (window, attempts, Hermes, GitHub writer, LLM feedback) | `apps/community` |
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

## Attempt result + tags

- `AttemptResult` = `EvaluationState` + `ScoreResult` + caller-supplied `feedback` string + optional `githubIssueUrl` / `githubCommentUrl`.
- Eligibility threshold: **≥70** (`ELIGIBILITY_THRESHOLD`); use `resolveEligible` / `buildAttemptTags`.
- Stable tags: `attempt:N`, `score:0-100`, `routing:auto|caution|defer`, `eligible:yes|no`.
- `formatAttemptCommentMarkdown` builds the GitHub comment body (prompt, score, dimensions, feedback, tags). No Jev naming.

## Public surface (current)

- Discriminated `Question` types (`NoulQuestion` / `ChoiceQuestion` / `ScoreQuestion` with `criteria` arrays)
- Placeholder rubric `v0`: four Score dimensions — specificity, verifiability, scope/limits, actionable acceptance (generic prompt quality; **no mission solution hints**)
- Mission rubric `rubric-m1-v1` (`m1-v1.ts`): same four Score ids with Mission 1 weights (verifiability 0.30, actionable-acceptance 0.30, specificity 0.25, scope-limits 0.15); criteria rewritten against mission-m1 public brief (**prompt quality only**)
- `scoreFromAnswers` → 0–100 composite + routing metadata
- `validateEvaluationState` / `validateAnswersForQuestions`
- `AttemptResult`, tag helpers, `formatAttemptCommentMarkdown`

## Scripts

```bash
pnpm --filter @metro/evaluation typecheck
pnpm --filter @metro/evaluation test
```

## What not to do

- Do not add TypeSafe SDK calls or env-based secrets in this spike.
- Do not mention Jev in participant-facing WhatsApp copy (Hermes / community messaging).
- Do not wire this package into `@metro/game`; game CI must stay independent.
- Do not generate LLM feedback here — callers pass `feedback` already filled.
