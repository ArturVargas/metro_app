import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEV_SHA, filledBody } from "./fixtures.js";
import type { PullRequestInfo } from "./github-pr.js";
import { preparePrSubmission, type PrSource } from "./prepare.js";
import { summarizeChecks } from "./github-pr.js";

const head = "f".repeat(40);

function source(pr: Partial<PullRequestInfo> = {}, mergeBase = DEV_SHA): PrSource {
  return {
    async get(number) {
      return {
        number,
        url: `https://github.com/ArturVargas/metro_app/pull/${number}`,
        open: true,
        baseRef: "dev",
        baseRepo: "ArturVargas/metro_app",
        headSha: head,
        body: filledBody(),
        ...pr,
      };
    },
    async diffFromBase() {
      return { diff: "diff --git a/apps/game/x.ts b/apps/game/x.ts\n+x", mergeBase };
    },
  };
}

const input = {
  prNumber: 7,
  participantId: "p-026",
  missionId: "mission-m3",
  devSha: DEV_SHA,
  repoFullName: "ArturVargas/metro_app",
};

describe("preparePrSubmission", () => {
  it("binds the exact prompt to the PR head SHA", async () => {
    const result = await preparePrSubmission(source(), input);
    assert.ok(result.ok);
    assert.equal(result.submission.headSha, head);
    assert.equal(result.submission.baseSha, DEV_SHA);
    assert.equal(result.submission.changeOrigin, "combined");
    assert.match(result.prompt, /contador/);
  });

  it("refuses PRs that target another branch, another participant or a stale base", async () => {
    assert.equal((await preparePrSubmission(source({ baseRef: "main" }), input)).ok, false);
    assert.equal((await preparePrSubmission(source(), { ...input, participantId: "p-111" })).ok, false);
    assert.equal((await preparePrSubmission(source({}, "0".repeat(40)), input)).ok, false);
    assert.equal(
      (await preparePrSubmission(source({ body: filledBody({ base: "1".repeat(40) }) }), input)).ok,
      false,
    );
  });

});

describe("summarizeChecks", () => {
  const run = (name: string, conclusion: string | null, completed_at: string | null) => ({
    name,
    status: completed_at ? "completed" : "in_progress",
    conclusion,
    completed_at,
  });

  it("needs every required check green", () => {
    assert.deepEqual(
      summarizeChecks([
        run("Lint, typecheck and web build", "success", "2026-11-03T10:00:00Z"),
        run("PR description", "success", "2026-11-03T09:00:00Z"),
      ]),
      { state: "success", completedAt: "2026-11-03T10:00:00Z" },
    );
    assert.equal(summarizeChecks([run("PR description", "success", "2026-11-03T09:00:00Z")]).state, "pending");
    assert.equal(
      summarizeChecks([
        run("Lint, typecheck and web build", "failure", "2026-11-03T10:00:00Z"),
        run("PR description", "success", "2026-11-03T09:00:00Z"),
      ]).state,
      "failure",
    );
  });
});
