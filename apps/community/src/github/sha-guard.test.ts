import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { latestProjectSnapshot } from "../project/snapshot.js";
import { assertShaNotEvaluated, submissionFromComment } from "./attempt-sequence.js";
import { issueBodyMarker } from "./markers.js";

const sha = "a".repeat(40);
const comment = (attempt: number, score: number, eligible: "yes" | "no", commitSha = sha) =>
  [
    `<!-- metro-attempt: mission:mission-m3 participant:p-026 attempt:${attempt} -->`,
    "<!-- metro-evaluation: provider:typesafe requested-model:jev-latest model:jev-1 feedback:template:x -->",
    `<!-- metro-submission: pr:https://github.com/ArturVargas/metro_app/pull/50 sha:${commitSha} base:${"b".repeat(40)} origin:llm -->`,
    "",
    "## Evaluation attempt",
    "",
    "### Tags",
    "",
    `attempt:${attempt} score:${score} routing:auto eligible:${eligible}`,
    "",
  ].join("\n");

describe("PR attempts", () => {
  it("parses the submission marker", () => {
    assert.deepEqual(submissionFromComment(comment(1, 70, "no")), {
      prUrl: "https://github.com/ArturVargas/metro_app/pull/50",
      sha,
      baseSha: "b".repeat(40),
      origin: "llm",
    });
  });

  it("refuses a second evaluation of the same SHA", () => {
    assert.throws(() => assertShaNotEvaluated([comment(1, 70, "no")], sha), /already evaluated/);
    assert.doesNotThrow(() => assertShaNotEvaluated([comment(1, 70, "no")], "c".repeat(40)));
  });

  it("projects only the latest attempt with its SHA and time", () => {
    const snapshot = latestProjectSnapshot({
      issueNumber: 60,
      issueUrl: "https://github.com/ArturVargas/metro_app/issues/60",
      issueBody: issueBodyMarker("mission-m3", "p-026"),
      comments: [comment(1, 70, "no", "c".repeat(40)), comment(2, 85, "yes")],
      commentDates: ["2026-11-03T08:00:00Z", "2026-11-03T09:00:00Z"],
      labels: ["review:approved"],
    });
    assert.equal(snapshot?.attempts, 2);
    assert.equal(snapshot?.pr?.evaluatedSha, sha);
    assert.equal(snapshot?.pr?.qualifies, true);
    assert.equal(snapshot?.pr?.evaluatedAt, "2026-11-03T09:00:00Z");
    assert.deepEqual(snapshot?.pr?.labels, ["review:approved"]);
  });
});
