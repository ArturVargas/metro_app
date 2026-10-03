# `@metro/evaluation`

Typed rubric, question definitions, composite Score scoring, validation,
attempt result / comment formatting, and the TypeSafe Jev adapter.

## Status

Jev adapter + `evaluate()` for Misión 1 and Misión 2. The default rubric is selected from `missionId`; callers may still request a wired version explicitly. Default client is a mock (no network, no secrets).
Live TypeSafe is `JEV_MODE=http` only. This package generates deterministic fallback feedback; it does not call an LLM or Hermes.

See [ADR-0006](../../.ai/adr/0006-jev-backend-integration.md).
See [ADR-0007](../../.ai/adr/0007-github-attempt-issue-comment-convention.md).
See [ADR-0009](../../.ai/adr/0009-m1-rubric-v2-hard-fails.md).

## Ownership

| Concern | Owner |
| --- | --- |
| Rubric versions, Score questions, scoring 0–100, validation | `@metro/evaluation` |
| AttemptResult, tag helpers, comment markdown (pure) | `@metro/evaluation` |
| Jev client (`JevClient`, mock, HTTP) and `evaluate()` | `@metro/evaluation` |
| GitHub persist, CLI, optional `--record` | `apps/community` |
| Template fallback and feedback metadata contract | `@metro/evaluation` |
| LLM feedback provider | later (not selected) |
| WhatsApp | Hermes (not this package) |

## Composite scoring

- Rubric dimensions are **parallel `Score` questions** (levels **0–4**).
- Normalize each level: `level / 4` → **0–1**, weighted sum × 100 → **0–100** (`scoreFromAnswers`).
- Mission 1 and 2 weights: verifiability 0.30, actionable-acceptance 0.30, specificity 0.25, scope-limits 0.15.
- **Confidence** (`high` / `medium` / `low`) is routing only. It does not change the total.
- WhatsApp **never names Jev**. `evaluate()` returns mission-specific structured Spanish fallback feedback.

## `evaluate()`

`evaluate(input)` builds `EvaluationState`, selects `rubric-m1-v2` for Misión 1 or `rubric-m2-v1` for Misión 2, asks the Jev client for Score answers, runs `scoreFromAnswers`, applies a hard-fail policy when applicable, and returns `AttemptResult` with feedback plus evaluator/feedback provenance.

Wired rubrics: `rubric-m1-v2` (M1 default + hard-fail cap 69), `rubric-m1-v1`, and `rubric-m2-v1` (M2 default, no hard-fails until calibration). Inject `options.client` / `options.hardFails` in tests; otherwise `createJevClient(env)` and any applicable prompt-based hard-fail detection.

## Jev HTTP

Official call (no SDK dependency; `fetch` only):

```http
POST {TYPESAFE_BASE_URL}/v1/systemone
Authorization: Bearer {TYPESAFE_API_KEY}
Content-Type: application/json
```

```json
{
  "model": "jev-latest",
  "state": {
    "missionId": "mission-m1",
    "rubricVersion": "rubric-m1-v2",
    "publicBrief": "...",
    "participantPrompt": "..."
  },
  "questions": {
    "verifiability": {
      "type": "score",
      "instructions": "<rubric prompt>",
      "criteria": ["level 0 ...", "level 1 ...", "level 2 ...", "level 3 ...", "level 4 ..."]
    }
  }
}
```

Score answers are fractional. We round to an integer level 0–4 (clamp). `confidence` is 0–1: `>= 0.8` high, `>= 0.5` medium, else low.

`MockJevClient` does not call this. Its default levels are a keyword heuristic so dry-run returns valid Score answers. Pass `levels` to pin them. It is not a judge.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `JEV_MODE` | No | `mock` (default) or `http` |
| `TYPESAFE_API_KEY` | http only | Bearer key from the TypeSafe console. **Never commit it.** |
| `JEV_API_KEY` | No | Alias used only if `TYPESAFE_API_KEY` is unset |
| `TYPESAFE_BASE_URL` | No | Default `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` | No | Default `jev-latest` |
| `JEV_MODEL` | No | Alias if `TYPESAFE_DEFAULT_MODEL` is unset |

## Attempt limit

- **5 evaluaciones por misión por participante** (`MAX_EVALUATIONS_PER_MISSION_PER_PARTICIPANT`).

## Attempt result + tags

- `AttemptResult` = state + score + evaluator metadata + `feedback` + feedback metadata + optional GitHub URLs.
- Evaluator metadata stores provider, requested model, resolved response model, and token usage when available.
- Eligibility threshold **≥70** (`ELIGIBILITY_THRESHOLD`) is written explicitly to `score.eligible` by `evaluate()`.
- Tags: `attempt:N`, `score:0-100`, `routing:auto|caution|defer`, `eligible:yes|no`.

## Public surface

- `evaluate` / `EvaluateInput`
- `JevClient`, `MockJevClient`, `HttpJevClient`, `createJevClient`
- `rubric-m1-v2`, `rubric-m1-v1`, `rubric-m2-v1`, hard-fail policy helpers, `scoreFromAnswers`, validation, `AttemptResult`, comment markdown

## Scripts

```bash
pnpm --filter @metro/evaluation typecheck
pnpm --filter @metro/evaluation test
```

## What not to do

- Do not commit API keys or tokens.
- Do not call an LLM from this package; accept caller-supplied LLM feedback metadata when that integration is added.
- Do not mention Jev in participant-facing feedback.
- Do not wire this package into `@metro/game`.
