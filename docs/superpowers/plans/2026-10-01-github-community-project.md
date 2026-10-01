# GitHub Community Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the private GitHub Project for the community experiment and keep each participant row synchronized with the authoritative attempt history in GitHub Issues.

**Architecture:** Issues remain authoritative. A small Project writer derives a snapshot from the latest valid attempt, upserts the participant Issue into the personal Project, and updates named fields through the GitHub Projects REST API. Project failures never invalidate a confirmed attempt; an idempotent reconciliation CLI repairs drift.

**Tech Stack:** TypeScript 5.9, Node.js 22, `@octokit/rest` for Issues, global `fetch` for GitHub Projects REST, Node test runner, GitHub Projects v2.

**Spec:** `docs/superpowers/specs/2026-10-01-github-community-project-design.md`

## Global Constraints

- Project name: `Metro App — Community Experiment`; owner: `ArturVargas`; visibility: private.
- `GITHUB_TOKEN` remains fine-grained and limited to `metro_app` with `Issues: Read and write`.
- `GITHUB_PROJECT_TOKEN` is a separate classic PAT owned by `ArturVargas` with scope `project`; never print or commit it.
- Issues and attempt comments are authoritative; Project fields are reconstructable snapshots.
- Confirm the attempt comment before Project synchronization. A Project failure must not reject or consume the attempt again.
- Use one Project item per participant×mission Issue; never one item per attempt.
- Never add phone numbers, raw WhatsApp message IDs, tokens, secrets, or full prompt text to Project fields.
- Do not write `Final votes` before supervised vote closure.
- This plan excludes the Hermes HTTP endpoint, WhatsApp delivery, vote collection, code-agent execution, and A/B/C deployment.
- Do not add a GitHub SDK dependency for Projects; use the existing runtime and global `fetch`.

## File Structure

| File | Responsibility |
| --- | --- |
| `.ai/references/community/github-project.md` | Live Project URL/number, field names, views, operating instructions and source locations. |
| `apps/community/src/github/markers.ts` | Parse the stable mission/participant marker already written in Issue bodies. |
| `apps/community/src/github/attempt-sequence.ts` | Derive the latest valid Project snapshot fields from attempt comments. |
| `apps/community/src/project/types.ts` | `ProjectPromptSnapshot`, `ProjectSyncResult` and `ProjectStore` contract. |
| `apps/community/src/project/config.ts` | Read and validate Project owner, number and token from environment. |
| `apps/community/src/project/github-project-store.ts` | GitHub REST lookup, add-item and field-update operations. |
| `apps/community/src/project/sync.ts` | Convert a persisted attempt to a Project snapshot and perform best-effort synchronization. |
| `apps/community/src/cli/reconcile-project.ts` | Rebuild Project prompt rows from open participant Issues without re-evaluation. |
| `apps/community/src/evaluate.ts` | Invoke optional Project sync only after the Issue comment is confirmed. |
| `apps/community/src/cli/evaluate.ts` | Build the Project store from environment and report a retryable sync failure. |
| `apps/community/src/index.ts` | Export Project configuration, store and snapshot contracts. |
| `apps/community/package.json` | Add `project:reconcile` script. |
| `apps/community/README.md` | Document Project variables, live workflow and reconciliation command. |

## Review Focus

- Repeating synchronization for an Issue already in the Project must update the existing item and never add a duplicate; covered by Task 3.
- A participant whose newest attempt drops below 70 after an eligible attempt must end as `Eligible = No` and `Voting = Not eligible`; covered by Tasks 2 and 5.
- A REST failure after adding an item but before updating fields must be safe to retry and converge to the complete snapshot; covered by Task 3.
- A Project failure after the Issue comment succeeds must return the evaluated attempt and emit a reconciliation warning; covered by Task 5.
- Closed synthetic Issues, mission Issues and malformed markers must not become prompt rows during reconciliation; covered by Task 4.

---

### Task 1: Create the private Project and Mission 1 item

**Files:**
- Create: `.ai/references/community/github-project.md`
- Modify: `.ai/references/community/INDEX.md`
- Modify: `.ai/adr/0002-github-as-community-system-of-record.md`

**Interfaces:**
- Consumes: approved field and view names from the spec.
- Produces: a live Project URL and number plus the exact field names that Task 3 resolves at runtime.

- [ ] **Step 1: Create the Project through the GitHub UI**

Under the `ArturVargas` account, create a private Project named `Metro App — Community Experiment` and link it to `ArturVargas/metro_app`.

- [ ] **Step 2: Configure fields exactly as specified**

Keep integrated `Title` and `Status`. Set Status options to `Planned`, `Active`, `Voting`, `Building`, `Published`, `Closed`. Create `Item type`, `Mission`, `Participant`, `Attempts`, `Latest score`, `Eligible`, `Voting`, `Final votes`, `Variant`, `Branch`, `Pull request`, and `Preview` with the types and select options from the spec.

- [ ] **Step 3: Configure the three views**

Create `Misiones` as a board filtered to `Item type = Mission`, `Prompts` as a table filtered to `Item type = Prompt`, and `Finalistas A/B/C` as a table filtered to `Voting = Selected`. Verify the visible columns and ordering against the spec.

- [ ] **Step 4: Create and add the Mission 1 Issue**

Create an Issue titled `Mission mission-m1 · Misión 1` linking `.ai/references/community/missions/mission-m1/public-brief.md` and `internal-contract.md`. Add it to the Project with `Item type = Mission`, `Mission = mission-m1`, and `Status = Active`. Do not add closed system Issue `#12`.

- [ ] **Step 5: Write the live context document**

Record Project URL, Project number, visibility, exact fields/views, Mission 1 Issue URL, how agents use the board, related skills, and source files in `.ai/references/community/github-project.md`. Add it to the community index immediately after the approved design.

- [ ] **Step 6: Verify the external artifact**

Open all three views and confirm: Project is private, Mission 1 appears only in `Misiones`, `Prompts` is empty, and `Finalistas A/B/C` is empty.

- [ ] **Step 7: Commit**

```bash
git add .ai/references/community/github-project.md .ai/references/community/INDEX.md .ai/adr/0002-github-as-community-system-of-record.md
git commit -m "docs(community): register GitHub Project"
```

### Task 2: Derive Project snapshots from Issue markers and attempts

**Files:**
- Modify: `apps/community/src/github/markers.ts`
- Modify: `apps/community/src/github/attempt-sequence.ts`
- Modify: `apps/community/src/github/attempt-sequence.test.ts`
- Create: `apps/community/src/project/types.ts`
- Create: `apps/community/src/project/snapshot.ts`
- Create: `apps/community/src/project/snapshot.test.ts`
- Modify: `apps/community/src/index.ts`

**Interfaces:**
- Consumes: Issue body marker `<!-- metro-issue: mission:<id> participant:<id> -->` and attempt tags `attempt:N score:NN routing:<value> eligible:yes|no`.
- Produces: `parseIssueIdentity(body: string): { missionId: string; participantId: string } | null`, `latestProjectSnapshot(input: { issueNumber: number; issueUrl: string; issueBody: string; comments: string[] }): ProjectPromptSnapshot | null`, and `snapshotFromPersistedAttempt(attempt: PersistAttemptResult): ProjectPromptSnapshot`.

- [ ] **Step 1: Write failing marker and snapshot tests**

Add tests asserting that a valid Issue marker returns mission and participant IDs, a mission Issue/malformed marker returns `null`, and comment history `[attempt:1 score:80 eligible:yes, attempt:2 score:62 eligible:no]` produces:

```ts
{
  missionId: "mission-m1",
  participantId: "p-alpha",
  attempts: 2,
  latestScore: 62,
  eligible: false,
  voting: "Not eligible"
}
```

Also assert that comments with duplicate attempt numbers, gaps, scores outside `0–100`, or missing tags are rejected rather than guessed.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @metro/community test`

Expected: FAIL because the parser and snapshot functions do not exist.

- [ ] **Step 3: Define the Project contracts**

In `types.ts`, define:

```ts
export type ProjectPromptSnapshot = {
  issueNumber: number;
  issueUrl: string;
  missionId: string;
  participantId: string;
  attempts: number;
  latestScore: number;
  eligible: boolean;
  voting: "Candidate" | "Not eligible";
};

export type ProjectSyncResult = { itemId: string; created: boolean };

export interface ProjectStore {
  syncPrompt(snapshot: ProjectPromptSnapshot): Promise<ProjectSyncResult>;
}
```

- [ ] **Step 4: Implement strict pure parsing**

Implement the three interfaces from this task. Select only the highest sequential valid attempt and set `voting` from the newest attempt's eligibility. Do not fall back to an older eligible attempt.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
```

Expected: all community tests pass and TypeScript exits `0`.

- [ ] **Step 6: Commit**

```bash
git add apps/community/src/github apps/community/src/project apps/community/src/index.ts
git commit -m "feat(community): derive Project prompt snapshots"
```

### Task 3: Add the GitHub Project REST store

**Files:**
- Create: `apps/community/src/project/config.ts`
- Create: `apps/community/src/project/config.test.ts`
- Create: `apps/community/src/project/github-project-store.ts`
- Create: `apps/community/src/project/github-project-store.test.ts`
- Modify: `apps/community/src/index.ts`

**Interfaces:**
- Consumes: `ProjectPromptSnapshot` and the exact Project/field names created in Task 1.
- Produces: `readProjectConfig(env?: NodeJS.ProcessEnv): ProjectConfig | null`, `requireProjectConfig(env?: NodeJS.ProcessEnv): ProjectConfig`, and `GitHubProjectStore implements ProjectStore`.

- [ ] **Step 1: Write failing configuration tests**

Assert that absent `GITHUB_PROJECT_TOKEN` returns `null`, partial configuration throws, the token value never appears in error messages, and complete input returns:

```ts
{
  token: "<redacted in assertions>",
  owner: "ArturVargas",
  projectNumber: 1,
  repoOwner: "ArturVargas",
  repo: "metro_app"
}
```

Use the actual Project number from Task 1 instead of `1` in the final test fixture.

- [ ] **Step 2: Write failing store tests with a mocked fetch**

Cover these cases:

- resolves the personal Project and fields by owner, number and exact names;
- finds an existing Project item, then updates it without another add request;
- adds the Issue once when no item exists;
- writes `Item type = Prompt`, mission, participant, attempts, latest score, eligible and voting;
- a second identical sync returns the same item;
- a mutation failure rejects, and retrying performs the complete idempotent update.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @metro/community test`

Expected: FAIL because Project config/store modules do not exist.

- [ ] **Step 4: Implement configuration readers**

Use `GITHUB_PROJECT_TOKEN`, `GITHUB_PROJECT_OWNER` defaulting to `ArturVargas`, `GITHUB_PROJECT_NUMBER`, `GITHUB_OWNER` defaulting to `ArturVargas`, and `GITHUB_REPO` defaulting to `metro_app`. Project number must be a positive integer.

- [ ] **Step 5: Implement `GitHubProjectStore` with global fetch**

Use GitHub Projects REST with API version `2026-03-10`. Resolve field IDs and single-select option IDs by exact name and cache metadata for the process lifetime. List items to find the Issue, add it only when absent, then update the complete snapshot with one `PATCH` request. This replaces the earlier GraphQL plan because the current REST API performs the same work with fewer calls and less custom request composition.

Do not implement Final votes, Variant, Branch, Pull request or Preview writes in this task; the attempt writer owns only the prompt snapshot fields.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
```

Expected: all tests pass and TypeScript exits `0`.

- [ ] **Step 7: Commit**

```bash
git add apps/community/src/project apps/community/src/index.ts
git commit -m "feat(community): sync prompt snapshots to GitHub Project"
```

### Task 4: Add idempotent reconciliation from open Issues

**Files:**
- Modify: `apps/community/src/github/issue-store.ts`
- Modify: `apps/community/src/github/issue-store.test.ts`
- Create: `apps/community/src/project/reconcile.ts`
- Create: `apps/community/src/project/reconcile.test.ts`
- Create: `apps/community/src/cli/reconcile-project.ts`
- Modify: `apps/community/package.json`
- Modify: `apps/community/src/index.ts`

**Interfaces:**
- Consumes: `GitHubIssueStore.listOpenProjectSnapshots(): Promise<ProjectPromptSnapshot[]>` and `ProjectStore.syncPrompt(snapshot)`.
- Produces: `reconcileProject(snapshots: ProjectPromptSnapshot[], store: ProjectStore): Promise<{ synced: number; failed: Array<{ issueNumber: number; error: string }> }>` and CLI script `project:reconcile`.

- [ ] **Step 1: Write failing Issue reader tests**

Mock repository Issues/comments and assert that `listOpenProjectSnapshots()` includes valid open participant Issues, excludes closed Issue `#12`, excludes the Mission Issue, excludes pull requests, and reports malformed attempt history instead of fabricating a snapshot.

- [ ] **Step 2: Write failing reconciler tests**

Assert that all valid snapshots are attempted, one failed item does not stop later items, counts are exact, and errors contain Issue numbers but no token or prompt text.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @metro/community test`

Expected: FAIL because the Issue reader and reconciler do not exist.

- [ ] **Step 4: Implement open-Issue snapshot reading**

Paginate `issues.listForRepo` with `state: "open"`, skip pull requests and non-participant markers, load comments, and call the pure snapshot parser from Task 2. Keep network concerns in `GitHubIssueStore`.

- [ ] **Step 5: Implement reconciler and CLI**

The CLI requires both token configurations, reads snapshots once, synchronizes each, prints JSON counts, returns non-zero when any item failed, and never calls TypeSafe.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
```

Expected: all tests pass and TypeScript exits `0`.

- [ ] **Step 7: Commit**

```bash
git add apps/community/src/github apps/community/src/project apps/community/src/cli/reconcile-project.ts apps/community/src/index.ts apps/community/package.json
git commit -m "feat(community): reconcile GitHub Project from Issues"
```

### Task 5: Synchronize the Project after a confirmed attempt

**Files:**
- Create: `apps/community/src/project/sync.ts`
- Create: `apps/community/src/project/sync.test.ts`
- Modify: `apps/community/src/evaluate.ts`
- Modify: `apps/community/src/evaluate.test.ts`
- Modify: `apps/community/src/cli/evaluate.ts`

**Interfaces:**
- Consumes: persisted `AttemptResult` with `issueNumber`, `githubIssueUrl`, `githubCommentUrl`; `ProjectStore.syncPrompt`.
- Produces: optional `projectStore` and `onProjectSyncError(error: Error, issueNumber: number): void` in `CommunityEvaluateOptions`.

- [ ] **Step 1: Write failing sync integration tests**

Assert:

- `record: false` never calls Project;
- successful record calls Project only after `recordAttempt` resolves;
- attempt 2 below 70 writes `attempts = 2`, `latestScore < 70`, `eligible = false`, `voting = "Not eligible"` even if attempt 1 was eligible;
- Project failure returns the persisted attempt unchanged and invokes `onProjectSyncError` once;
- Project success does not change participant feedback or evaluator metadata.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @metro/community test`

Expected: FAIL because Project sync options do not exist.

- [ ] **Step 3: Implement best-effort post-persistence sync**

After `recordAttempt` resolves, convert the result with `snapshotFromPersistedAttempt` and call the Project store. Catch only Project synchronization errors, pass them to `onProjectSyncError`, and return the confirmed attempt. Do not catch TypeSafe or Issue persistence errors.

- [ ] **Step 4: Wire the CLI from environment**

When `--record` and complete Project configuration are present, construct `GitHubProjectStore`. Write a concise warning with the Issue number on sync failure and tell the operator to run `project:reconcile`; never print prompt text or tokens.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
```

Expected: all tests pass and TypeScript exits `0`.

- [ ] **Step 6: Commit**

```bash
git add apps/community/src/project apps/community/src/evaluate.ts apps/community/src/evaluate.test.ts apps/community/src/cli/evaluate.ts
git commit -m "feat(community): sync confirmed attempts to Project"
```

### Task 6: Verify live Project synchronization and document operations

**Files:**
- Modify: `.ai/references/community/github-project.md`
- Create: `.ai/references/community/missions/mission-m1/project-verification-2026-10-01.md`
- Modify: `.ai/references/community/missions/mission-m1/INDEX.md`
- Modify: `.ai/references/operations/github-community-writer.md`
- Modify: `apps/community/README.md`

**Interfaces:**
- Consumes: the live Project, owner Issues token, separate Project token, `project:reconcile` CLI.
- Produces: verified operational evidence and runbook; no production participant attempt.

- [ ] **Step 1: Configure the Project token locally**

Create a classic PAT from `ArturVargas` with scope `project`, store it as `GITHUB_PROJECT_TOKEN` outside Git, and set `GITHUB_PROJECT_NUMBER` to the number recorded in Task 1. Do not paste or print the token.

- [ ] **Step 2: Run all local checks**

Run:

```bash
pnpm --filter @metro/evaluation test
pnpm --filter @metro/evaluation typecheck
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
```

Expected: all tests pass and both typechecks exit `0`.

- [ ] **Step 3: Run reconciliation against GitHub**

Run `pnpm --filter @metro/community project:reconcile`. Expected initial result: Mission Issue is ignored, closed Issue `#12` is ignored, and only open participant Issues are synchronized.

- [ ] **Step 4: Perform a reversible synthetic live check**

Create one synthetic open participant Issue through the existing writer, reconcile it, verify exactly one Project item and the expected fields, repeat reconciliation, and verify the item count remains one. Close the synthetic Issue and remove its Project item after capturing evidence.

- [ ] **Step 5: Document evidence and operations**

Record Project URL, commands, result counts, idempotency, cleanup and any API warnings. Update README variables and explain that Issue persistence succeeds even when Project sync needs reconciliation.

- [ ] **Step 6: Final verification**

Run:

```bash
git diff --check
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
```

Expected: clean diff check, all tests pass, typecheck exits `0`.

- [ ] **Step 7: Commit**

```bash
git add .ai/references/community .ai/references/operations apps/community/README.md
git commit -m "docs(community): verify GitHub Project synchronization"
```

## Deferred Follow-up Plans

- Hermes ingress endpoint, allowlisted group/window validation, SHA-256 message deduplication and structured response delivery.
- Hidden vote collection and supervised vote closure.
- Random A/B/C assignment plus branch/PR/preview field updates.
- Migration from a personal Project and classic PAT to an organization-owned Project with GitHub App authentication.
