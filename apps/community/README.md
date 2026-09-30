# `@metro/community`

Community backend: evaluate a participant prompt with Jev (mock by default) and optionally persist a verified TypeSafe attempt on GitHub.

No Hermes or LLM provider yet. Evaluations return versioned template feedback until the light-LLM provider is selected.

## Status

- `evaluate()` → `@metro/evaluation` for `rubric-m1-v1` → `AttemptResult`.
- `--record` requires a TypeSafe result and writes it with `GitHubIssueStore` (one issue per participant × mission, one comment per attempt).
- Default Jev client is the mock. Live TypeSafe only when `JEV_MODE=http`.
- GitHub history determines the next attempt. Attempts must be sequential and stop after five.

See [ADR-0006](../../.ai/adr/0006-jev-backend-integration.md) and [ADR-0007](../../.ai/adr/0007-github-attempt-issue-comment-convention.md).

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
| `TYPESAFE_API_KEY` | http only | TypeSafe bearer key. `JEV_API_KEY` is a fallback name. **Never commit secrets.** |
| `TYPESAFE_BASE_URL` | No | Default `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` or `JEV_MODEL` | No | Default `jev-latest` |
| `GITHUB_TOKEN` or `GH_TOKEN` | `--record` only | Issues/comments/labels. Not required to print JSON. |
| `GITHUB_OWNER` | No | Default `ArturVargas` |
| `GITHUB_REPO` | No | Default `metro_app` |
| `DRY_RUN` | No | Only for `github:record-attempt` (print markdown, no write) |

Request shape for `JEV_MODE=http`: `POST /v1/systemone` with `{ model, state, questions }` where each rubric dimension is `{ "type": "score", "instructions", "criteria": [level0..level4] }`. Details in `packages/evaluation/README.md`.

## CLI

From the monorepo root, after `pnpm install`. `--fixture` paths are relative to `apps/community` when run via `pnpm --filter`.

```bash
# Mock Jev (default). Prints AttemptResult JSON. No network.
pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json

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

## Scripts

```bash
pnpm --filter @metro/community typecheck
pnpm --filter @metro/community test
pnpm --filter @metro/community evaluate -- --fixture fixtures/prompt.json
```

## Public surface

- `evaluate(input, { client, record, store, env })`
- `GitHubIssueStore.findOrCreateIssue` / `assertAttemptAllowed` / `addAttemptComment`
- `requireGitHubStoreConfig()` / `readGitHubEnvConfig()`

## What not to do

- Do not open PRs from automation unless Artur explicitly says OK.
- Do not store phones, tokens, or secrets on issues or in the repo.
- Do not wire this app into `@metro/game` CI (`game-checks` stays game-only).
- Do not call Hermes or an LLM from this app.
