# Community Evaluation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recorded prompt evaluations enforce the five-attempt contract, reject mock results, return useful fallback feedback, and preserve evaluator provenance.

**Architecture:** Keep rubric and result construction in `@metro/evaluation`; keep GitHub history enforcement in `@metro/community`. Extend the current result contract instead of adding services or dependencies.

**Tech Stack:** TypeScript, Node test runner, Octokit, pnpm.

**Spec:** `.ai/references/community/experiment-rules.md`, `.ai/adr/0006-jev-backend-integration.md`, `.ai/adr/0007-github-attempt-issue-comment-convention.md`

## Global Constraints

- Maximum five evaluations per participant and mission.
- Only the latest attempt determines eligibility; threshold is 70.
- Participant-facing feedback never names Jev.
- GitHub stores pseudonymous IDs and no secrets or phone numbers.
- No new runtime dependency or database.

## Review Focus

- Repeated, skipped, or regressive attempt numbers must be rejected before a comment is created.
- A sixth attempt must be rejected even when the caller labels it 1–5.
- Mock evaluations must never be persisted.
- A malformed TypeSafe response must not produce provenance or a score.
- Every successful evaluation must include nonempty feedback and evaluator metadata.

---

### Task 1: Feedback and evaluator provenance

**Files:**
- Modify: `packages/evaluation/src/jev/types.ts`
- Modify: `packages/evaluation/src/jev/http.ts`
- Modify: `packages/evaluation/src/jev/mock.ts`
- Create: `packages/evaluation/src/feedback-template.ts`
- Modify: `packages/evaluation/src/attempt.ts`
- Modify: `packages/evaluation/src/evaluate.ts`
- Test: `packages/evaluation/src/evaluate.test.ts`
- Test: `packages/evaluation/src/jev.test.ts`

**Interfaces:**
- Produces: `JevScoreResult`, evaluator metadata on `AttemptResult`, versioned template feedback.

- [ ] Add failing tests for exact response model/usage metadata, eligibility, and nonempty structured fallback feedback.
- [ ] Run the package tests and confirm the new assertions fail.
- [ ] Return decisions plus metadata from both clients and generate the minimal template feedback from rubric dimensions.
- [ ] Run typecheck and tests until green.
- [ ] Commit the task.

### Task 2: Recorded-attempt safety

**Files:**
- Modify: `apps/community/src/github/issue-store.ts`
- Modify: `apps/community/src/evaluate.ts`
- Create: `apps/community/src/github/attempt-sequence.ts`
- Test: `apps/community/src/github/attempt-sequence.test.ts`
- Test: `apps/community/src/evaluate.test.ts`

**Interfaces:**
- Consumes: evaluator metadata from Task 1.
- Produces: sequential attempt validation and mock persistence rejection.

- [ ] Add failing tests for attempts 1–5, duplicate/skipped numbers, sixth attempt, and mock recording.
- [ ] Run the community tests and confirm the new assertions fail.
- [ ] Parse persisted attempt markers, require the next sequential attempt, cap at five, and reject non-TypeSafe results before GitHub writes.
- [ ] Run typecheck and tests until green.
- [ ] Commit the task.

### Task 3: Contracts, fixtures, and documentation

**Files:**
- Modify: `apps/community/fixtures/attempt.json`
- Modify: `apps/community/README.md`
- Modify: `packages/evaluation/README.md`
- Modify: `.ai/adr/0006-jev-backend-integration.md`
- Modify: `.ai/adr/0007-github-attempt-issue-comment-convention.md`
- Modify: `.ai/references/community/missions/mission-m1/internal-contract.md`

**Interfaces:**
- Consumes: metadata and attempt enforcement from Tasks 1–2.

- [ ] Update fixtures and source-of-truth documents with exact shipped behavior.
- [ ] Run all evaluation/community checks and the dry-run CLI.
- [ ] Commit the task.

### Task 4: Whole-branch verification and delivery

**Files:**
- Review all branch changes.

**Interfaces:**
- Consumes: completed Tasks 1–3.

- [ ] Run repository typechecks/tests relevant to the changed packages and both CLIs.
- [ ] Review the diff against the approved rules and fix important findings with RED→GREEN tests.
- [ ] Push `fix/community-evaluation-safety` and open a PR to `main` with validation evidence.
