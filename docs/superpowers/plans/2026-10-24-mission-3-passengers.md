# Mission 3 Waiting Passengers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Mission 3 stub with approved participant-facing and internal artifacts, then verify through TypeSafe calibration that a small, strong passenger PR can qualify while incomplete submissions do not.

**Architecture:** Keep product rules in the public brief, operational and evaluation mappings in the internal contract, and synthetic prompt↔diff evidence in versioned calibration fixtures. Reuse `rubric-m3-v1` unchanged; if calibration cannot separate the agreed cases, stop and revisit mission size or rubric in a separate decision instead of tuning results silently.

**Tech Stack:** Markdown mission documents, JSON calibration fixtures, TypeScript evaluation CLI, TypeSafe/Jev HTTP evaluator, pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md`

## Global Constraints

- Mission mode is `participant-pr`: each participant works from frozen `dev` SHA `acd8258ce3dcc45f01c449e47204b10aa7e45b7f` and opens a PR toward `dev`.
- The public brief fixes passenger meaning, pause behavior, capacity 12, reproducibility, reset behavior, and preserved baseline behavior.
- Participants choose frequency, origin distribution, valid destination-shape distribution, visual arrangement, and verification evidence.
- Passengers do not board, travel, transfer, trigger congestion, score, victory, or defeat in Mission 3.
- Expected changes stay in `apps/game/`; no dependency, backend, protected-path, or workflow changes are permitted.
- Qualification remains strictly above 80, with at most five evaluations per participant and checks plus human approval required.
- Do not activate Hermes, write real attempts, publish to WhatsApp, or modify the VPS in this plan.
- Dates remain explicitly pending; publication cannot proceed until Artur approves them.

## Review Focus

- Public and internal documents must contain the same six observable acceptance behaviors; Task 1 verifies their mapping explicitly.
- Open participant decisions must not become hidden evaluator requirements; Task 1 records them as variable and Task 2 uses different valid choices in the strong fixture.
- A paused simulation must not accumulate hidden arrivals that burst on resume; the strong fixture and its declared tests cover pause, waiting, and resume behavior.
- Determinism must concern simulated elapsed time and the same actions, not wall-clock rendering cadence; Task 1 states this and Task 2 demonstrates two clean runs.
- Calibration must be stable enough for an 80-point boundary: Task 3 runs each case three times and rejects eligibility changes or dimension swings greater than one level.

---

### Task 1: Publishable brief and internal contract

**Files:**
- Modify: `.ai/references/community/missions/mission-m3/public-brief.md`
- Create: `.ai/references/community/missions/mission-m3/internal-contract.md`
- Modify: `.ai/references/community/missions/mission-m3/INDEX.md`

**Interfaces:**
- Consumes: the approved rules and exclusions in `docs/superpowers/specs/2026-10-23-mission-3-passengers-design.md`.
- Produces: the exact `publicBrief` text used by every calibration fixture and the internal acceptance mapping used during technical review.

- [ ] **Step 1: Replace the public stub with the participant-facing brief**

Use the headings from `.ai/references/community/mission-public-brief-template.md`. State the problem, objective, current Base/dev context, fixed rules, preserved behavior, and three-to-five grouped observable completion criteria. Include the Mission 3–5 PR participation footer verbatim. Do not include implementation suggestions, intervals, probabilities, layout instructions, TypeSafe, rubric weights, or hard-fail rules.

- [ ] **Step 2: Create the internal contract**

Set `mission-m3`, version `1`, modality `participant-pr`, state `borrador`, branch `dev`, and base SHA `acd8258ce3dcc45f01c449e47204b10aa7e45b7f`. Map every public criterion to `rubric-m3-v1` evidence, record the expected change area `apps/game/`, the protected paths already enforced by `m3-policy.ts`, the five-attempt rule, `>80` threshold, technical queue, and A/B/C selection order. Keep dates and Issue URL marked `PENDIENTE` and state that this blocks publication.

- [ ] **Step 3: Make determinism observable without choosing an implementation**

In both documents, define reproducibility as: two clean runs with the same player actions and the same amount of active simulation time produce the same ordered origins and destination shapes. A pause advances neither passenger generation nor its pending schedule.

- [ ] **Step 4: Update the Mission 3 index**

Replace the stub labels with links to the real brief, internal contract, design, existing general rubric calibration, and the passenger-specific calibration that Task 3 will create. Keep Hermes and public-message status pending.

- [ ] **Step 5: Verify document consistency**

Run:

```bash
rg -n "STUB|TODO antes de publicar" .ai/references/community/missions/mission-m3
rg -n "12|paus|reanuda|reproduc|recarg|abord|transfer" \
  .ai/references/community/missions/mission-m3/public-brief.md \
  .ai/references/community/missions/mission-m3/internal-contract.md
git diff --check
```

Expected: the first command returns no brief/contract stub markers; both mission documents expose the fixed rules and exclusions; `git diff --check` is clean.

- [ ] **Step 6: Commit the mission documents**

```bash
git add .ai/references/community/missions/mission-m3/public-brief.md \
  .ai/references/community/missions/mission-m3/internal-contract.md \
  .ai/references/community/missions/mission-m3/INDEX.md
git commit -m "docs(mission3): define waiting passengers brief"
```

### Task 2: Passenger-specific calibration fixtures

**Files:**
- Create: `apps/community/fixtures/calibration-m3/passengers-weak.json`
- Create: `apps/community/fixtures/calibration-m3/passengers-mid.json`
- Create: `apps/community/fixtures/calibration-m3/passengers-strong.json`

**Interfaces:**
- Consumes: exact public brief from Task 1 and the `CodeSubmission` fixture shape consumed by `apps/community/src/cli/evaluate.ts`.
- Produces: three deterministic, non-recording calibration inputs for Task 3.

- [ ] **Step 1: Create the weak fixture**

Use participant `p-000`, attempt `1`, rubric `rubric-m3-v1`, base SHA `acd8258ce3dcc45f01c449e47204b10aa7e45b7f`, and a small `apps/game/` diff. The prompt says only to show random passenger shapes; the diff renders a fixed decorative shape and implements none of generation, pause, capacity, valid destination, or reproducibility. Declared tests are generic. Manual expectation: `core-gap`, final total `0`, not qualified.

- [ ] **Step 2: Create the medium fixture**

Use the same metadata and public brief. The prompt makes concrete choices for frequency and visual placement. The diff progressively adds passenger shapes but uses nondeterministic randomness, continues during pause, and lacks the capacity guard. Declared tests acknowledge only appearance and progression. Manual expectation: coverage or fidelity at level 2, `core-gap`, final total `0`, not qualified.

- [ ] **Step 3: Create the strong fixture**

Use the same metadata and public brief. The prompt chooses its own frequency, distribution, layout, and verification. The small diff changes only `apps/game/`, implements a deterministic passenger sequence based on active simulation time, rejects same-shape destinations, stops at 12, pauses without catch-up, resumes, and clears on reload. Declared tests include two clean-run sequence comparisons plus desktop/mobile checks and the existing lint, typecheck, and web build. Manual expectation: coverage and fidelity at least level 3, total above 80, no hard-fail, qualified.

- [ ] **Step 4: Validate fixture syntax and local policy behavior**

Run each fixture with the mock client, without `--record`:

```bash
pnpm --filter @metro/community evaluate --mock --fixture apps/community/fixtures/calibration-m3/passengers-weak.json
pnpm --filter @metro/community evaluate --mock --fixture apps/community/fixtures/calibration-m3/passengers-mid.json
pnpm --filter @metro/community evaluate --mock --fixture apps/community/fixtures/calibration-m3/passengers-strong.json
```

Expected: all commands parse and return a Mission 3 result; none reports `protected-path`, `empty-diff`, `diff-too-large`, `hidden-text`, or `evaluator-injection`. Mock scores are not calibration evidence.

- [ ] **Step 5: Run repository verification**

Run:

```bash
pnpm --filter @metro/evaluation test
pnpm --filter @metro/evaluation typecheck
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
git diff --check
```

Expected: all commands pass and no tracked file outside the three fixtures changed in this task.

- [ ] **Step 6: Commit the fixtures**

```bash
git add apps/community/fixtures/calibration-m3/passengers-weak.json \
  apps/community/fixtures/calibration-m3/passengers-mid.json \
  apps/community/fixtures/calibration-m3/passengers-strong.json
git commit -m "test(mission3): add passenger calibration cases"
```

### Task 3: TypeSafe calibration report and readiness gate

**Files:**
- Create: `.ai/references/community/missions/mission-m3/calibration-2026-10-24-passengers.md`
- Modify: `.ai/references/community/missions/mission-m3/INDEX.md`
- Do not modify: `packages/evaluation/src/rubrics/m3-v1.ts`, `packages/evaluation/src/m3-policy.ts`, or the threshold in this plan.

**Interfaces:**
- Consumes: the three fixtures from Task 2, `JEV_MODE=http`, configured Jev credentials, and the existing evaluation CLI.
- Produces: a reproducible calibration report and a binary `ready` or `not ready` decision for the repository stage.

- [ ] **Step 1: Run every fixture three times without persistence**

Load the existing local environment and run `pnpm --filter @metro/community evaluate --fixture <path>` three times per fixture. Never pass `--record`. Capture only total, eligible, five dimension levels, hard-fails, resolved model, and run time; do not copy secrets into the report.

- [ ] **Step 2: Apply the calibration gate**

Mark the mission `ready` only if all three conditions hold:

- weak and medium never qualify;
- strong qualifies in all three runs with no hard-fail;
- no case changes eligibility and no dimension varies by more than one level across runs.

If a condition fails, stop. Record `not ready`, the observed results, and whether the evidence points to fixture fidelity, mission size, or rubric behavior. Do not change the rubric or threshold in the same commit.

- [ ] **Step 3: Write the calibration report**

Record date, timezone `America/Mexico_City`, rubric and policy versions, requested and resolved Jev model, absence of `--record`, fixture expectations, all three results per case, score swing, eligibility stability, dimension stability, and the readiness decision. Link the design, brief, contract, fixtures, and previous general M3 calibration.

- [ ] **Step 4: Update the Mission 3 index**

Link the passenger calibration report and state its readiness result. Keep dates, fork rehearsal, Hermes VPS application, and WhatsApp publication explicitly pending.

- [ ] **Step 5: Run final repository verification**

Run:

```bash
pnpm --filter @metro/evaluation test
pnpm --filter @metro/evaluation typecheck
pnpm --filter @metro/community test
pnpm --filter @metro/community typecheck
pnpm --filter @metro/game lint
pnpm --filter @metro/game typecheck
pnpm --filter @metro/game build:web
git diff --check
```

Expected: all checks pass. Confirm no secrets, generated build output, participant data, or recorded GitHub attempts were added.

- [ ] **Step 6: Commit the calibration result**

```bash
git add .ai/references/community/missions/mission-m3/calibration-2026-10-24-passengers.md \
  .ai/references/community/missions/mission-m3/INDEX.md
git commit -m "docs(mission3): record passenger calibration"
```

## Stopping point

This plan ends when the repository artifacts are calibrated and marked ready or not ready. A separate operational plan must cover dates, the fork rehearsal, GitHub Project mission setup, Hermes patch application on the VPS, activation of `METRO_ACTIVE_MISSION=mission-m3`, and the WhatsApp announcement. None of those actions is implied by completing this plan.
