# `@metro/community`

Community backend spike: persist evaluation attempts to GitHub Issues/comments.
Hermes, Jev adapter, and LLM feedback generation come in later PRs.

## Status

**Spike: evaluate + issue.** Contract + GitHub writer only.

- Consumes `@metro/evaluation` (`AttemptResult`, comment markdown, tags).
- Writes one GitHub Issue per `(participantId × missionId)`.
- Each attempt is a **comment** with prompt, score, dimensions, feedback, tags.
- Does **not** call Jev, Hermes, or an LLM.

See [ADR-0007](../../.ai/adr/0007-github-attempt-issue-comment-convention.md).

## Issue / comment / tags model

| Concept | Convention |
| --- | --- |
| Issue identity | One issue per `(missionId × participantId)` |
| Stable marker | `<!-- metro-issue: mission:<id> participant:<id> -->` in issue body (+ plain `mission:` / `participant:` lines for search) |
| Attempt | Comment body from `formatAttemptCommentMarkdown` |
| Comment tags | `attempt:N` `score:0-100` `routing:auto\|caution\|defer` `eligible:yes\|no` |
| Issue labels (latest) | `mission:<id>`, `routing:…`, `eligible:yes\|no`, `attempt:N` (score stays on comment tags; ADR-0002) |
| Eligibility | From latest attempt only; threshold ≥70 |

WhatsApp / participant-facing text never names **Jev**. Internal issue metadata may say “evaluation”.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` or `GH_TOKEN` | Yes (live writes) | Token with permission to create issues/comments/labels on the target repo. **Never commit secrets.** |
| `GITHUB_OWNER` | No | Default `ArturVargas` |
| `GITHUB_REPO` | No | Default `metro_app` |
| `DRY_RUN` | No | `1` / `true` → print markdown JSON only, no GitHub calls |

Use a fine-scoped PAT or GitHub App installation token. Do not put tokens in the repo, fixtures, or commit history.

## CLI dry-run

From the monorepo root (after `pnpm install`):

```bash
# Print formatted markdown without calling GitHub
DRY_RUN=1 pnpm --filter @metro/community github:record-attempt -- --fixture fixtures/attempt.json

# Or pipe JSON
cat apps/community/fixtures/attempt.json | DRY_RUN=1 pnpm --filter @metro/community github:record-attempt
```

Live persist (needs token; optional for this spike):

```bash
export GITHUB_TOKEN=ghp_...   # do not commit
pnpm --filter @metro/community github:record-attempt -- --fixture fixtures/attempt.json
```

Working directory for `--fixture` relative paths is the `@metro/community` package root when run via `pnpm --filter`.

## Scripts

```bash
pnpm --filter @metro/community typecheck
pnpm --filter @metro/community github:record-attempt -- --dry-run --fixture fixtures/attempt.json
```

## Public surface

- `GitHubIssueStore.findOrCreateIssue(missionId, participantId)`
- `GitHubIssueStore.addAttemptComment(attemptResult)`
- `requireGitHubStoreConfig()` / `readGitHubEnvConfig()`

## What not to do

- Do not open PRs from automation unless Artur explicitly says OK.
- Do not store phones, tokens, or secrets on issues/comments.
- Do not wire this app into `@metro/game` CI (`game-checks` stays game-only).
