# `@metro/community`

Community backend: evaluate a participant prompt with Jev, generate participant feedback, and optionally persist a verified TypeSafe attempt on GitHub.

No Hermes. Feedback defaults to the versioned template (`FEEDBACK_MODE=stub`). `FEEDBACK_MODE=local` calls a local Ollama model (`gemma4-coding-agent` by default). `FEEDBACK_MODE=openrouter` calls OpenRouter chat completions with `prompts/mentor.md` (Picosito). `http` stays unconfigured.

## Status

- `evaluate()` scores `rubric-m1-v1` via `@metro/evaluation`, then fills `AttemptResult.feedback` and its provenance.
- `--record` requires a TypeSafe result and writes it with `GitHubIssueStore` (one issue per participant × mission, one comment per attempt).
- Default Jev client is the mock. Live TypeSafe only when `JEV_MODE=http`.
- GitHub history determines the next attempt. Attempts must be sequential and stop after five.
- The MVP runs one community-writer process. Its keyed lock covers admission, evaluation, and persistence for each participant × mission.
- Exact retries reuse the existing comment and resync labels instead of consuming another attempt.

See [ADR-0006](../../.ai/adr/0006-jev-backend-integration.md), [ADR-0007](../../.ai/adr/0007-github-attempt-issue-comment-convention.md), and [ADR-0008](../../.ai/adr/0008-openrouter-mentor-feedback.md).

## Issue / comment / tags model

| Concept | Convention |
| --- | --- |
| Issue identity | One issue per `(missionId × participantId)` |
| Stable marker | `<!-- metro-issue: mission:<id> participant:<id> -->` |
| Attempt | Comment body from `formatAttemptCommentMarkdown` |
| Comment tags | `attempt:N` `score:0-100` `routing:auto\|caution\|defer` `eligible:yes\|no` |
| Issue labels (latest) | `mission:<id>`, `routing:…`, `eligible:yes\|no`, `attempt:N` |
| Eligibility | Latest attempt only; threshold ≥70 |
| Evaluation metadata | Hidden comment marker with provider, requested model, resolved model, and feedback version |

Participant-facing text never names **Jev**.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `JEV_MODE` | No | `mock` (default) or `http`. CLI `--mock` forces the mock. |
| `FEEDBACK_MODE` | No | `stub` (default), `local` (Ollama), `openrouter` (OpenRouter + mentor.md), or `http` (throws `not configured`). |
| `OLLAMA_BASE_URL` | No | Local feedback only. Default `http://127.0.0.1:11434`. |
| `OLLAMA_MODEL` | No | Local feedback only. Default `gemma4-coding-agent`. |
| `OPENROUTER_API_KEY` | openrouter | Bearer key for OpenRouter. **Never commit secrets.** |
| `OPENROUTER_MODEL` | No | OpenRouter model id. Default `google/gemini-2.5-flash`. |
| `OPENROUTER_BASE_URL` | No | Default `https://openrouter.ai/api/v1`. |
| `TYPESAFE_API_KEY` | http only | TypeSafe bearer key. `JEV_API_KEY` is a fallback name. **Never commit secrets.** |
| `TYPESAFE_BASE_URL` | No | Default `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` or `JEV_MODEL` | No | Default `jev-latest` |
| `GITHUB_TOKEN` or `GH_TOKEN` | `--record` only | Fine-grained PAT created by `ArturVargas`, limited to `metro_app`, with `Issues: Read and write`. Not required to print JSON. |
| `GITHUB_OWNER` | No | Default `ArturVargas` |
| `GITHUB_REPO` | No | Default `metro_app` |
| `DRY_RUN` | No | Only for `github:record-attempt` (print markdown, no write) |

Request shape for `JEV_MODE=http`: `POST /v1/systemone` with `{ model, state, questions }` where each rubric dimension is `{ "type": "score", "instructions", "criteria": [level0..level4] }`. Details in `packages/evaluation/README.md`.

Because `metro_app` belongs to a personal account, a fine-grained PAT created by an outside collaborator can return `403 Resource not accessible by personal access token` even when that collaborator can push code. Use the repository owner's token for the pilot; never commit it. See [community writer operations](../../.ai/references/operations/github-community-writer.md).

## CLI

From the monorepo root, after `pnpm install`. `--fixture` paths are relative to `apps/community` when run via `pnpm --filter`.

```bash
# Mock Jev + stub feedback (default). Prints AttemptResult JSON. No network, no GitHub.
pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json

# Mock Jev + local Ollama feedback (requires Ollama on OLLAMA_BASE_URL with the model pulled)
FEEDBACK_MODE=local pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json --mock

# Mock Jev + OpenRouter mentor feedback (requires OPENROUTER_API_KEY)
FEEDBACK_MODE=openrouter OPENROUTER_API_KEY=... pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json --mock

# Flags instead of a fixture
pnpm --filter @metro/community evaluate -- \
  --mission mission-m1 --participant p-alpha --attempt 1 \
  --brief "Public brief text" --prompt "Participant prompt"

# Live Jev, still no GitHub write
JEV_MODE=http TYPESAFE_API_KEY=... pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json

# Persist a live attempt (TypeSafe and GitHub tokens required). Mock results are rejected.
JEV_MODE=http TYPESAFE_API_KEY=... GITHUB_TOKEN=... \
  pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json --record

# Existing writer: fixture AttemptResult JSON, no Jev
DRY_RUN=1 pnpm --filter @metro/community github:record-attempt -- --fixture fixtures/attempt.json
```

## Local Ollama feedback

`LocalLlmFeedbackGenerator` POSTs `POST {OLLAMA_BASE_URL}/api/chat` with `think: false`, `temperature: 0.2`, `num_predict: 512`. It requests structured Spanish feedback with the exact score, eligibility, one strength, at most two prioritized problems and suggestions, and one revision question. Invalid output or an Ollama error falls back to `feedback-template-m1-v1`. Unit tests mock `fetch`; a live smoke needs the model available locally:

```bash
curl -s http://127.0.0.1:11434/api/tags | grep gemma4-coding-agent
FEEDBACK_MODE=local pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json --mock
```


## OpenRouter mentor feedback

`OpenRouterFeedbackGenerator` loads `apps/community/prompts/mentor.md` (Picosito: warm roast / coach animado in Spanish) and POSTs `POST {OPENROUTER_BASE_URL}/chat/completions` with a 512-token output limit. The brief and participant prompt are marked as untrusted `<evaluation-data>`; generated feedback must match the complete expected shape with no extra text or conflicting score. API/network/empty failures emit `community.feedback.openrouter_fallback` without participant content and fall back to `feedback-template-m1-v1`. Provenance: `provider: "openrouter"`, `version` from mentor frontmatter (default `feedback-mentor-m1-v2`). Unit tests mock `fetch`.

```bash
# .env.local on the VPS (never commit):
# FEEDBACK_MODE=openrouter
# OPENROUTER_API_KEY=...
# OPENROUTER_MODEL=google/gemini-2.5-flash   # optional
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # optional

FEEDBACK_MODE=openrouter OPENROUTER_API_KEY=... \
  pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json --mock
```

## Scripts

```bash
pnpm --filter @metro/community typecheck
pnpm --filter @metro/community test
pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json
```

## Public surface

- `evaluate(input, { client, record, store, env, feedback, feedbackGenerator })`
- `StubFeedbackGenerator` / `LocalLlmFeedbackGenerator` / `OpenRouterFeedbackGenerator` / `createFeedbackGenerator()` (`FEEDBACK_MODE`)
- `GitHubIssueStore.findOrCreateIssue` / `assertAttemptAllowed` / `recordAttempt` / `addAttemptComment`
- `requireGitHubStoreConfig()` / `readGitHubEnvConfig()`

## What not to do

- Do not open PRs from automation unless Artur explicitly says OK.
- Do not store phones, tokens, or secrets on issues or in the repo.
- Do not wire this app into `@metro/game` CI (`game-checks` stays game-only).
- Do not call Hermes or wire Hermes into this app yet. `FEEDBACK_MODE=http` stays unconfigured.
- Do not run multiple community-writer processes until admission moves to a durable distributed queue or lease.
